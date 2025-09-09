const CollaborativePurchase = require('../models/CollaborativePurchase');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Create collaborative purchase
const createCollaborativePurchase = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not found in request' });
    }

    const { productID, productId, quantity, participants } = req.body;
    
    // Support both productID and productId for backward compatibility
    const finalProductId = productID || productId;

    console.log('Received collaborative purchase request:', {
      productID,
      productId,
      finalProductId,
      quantity,
      participants,
      productIdType: typeof finalProductId,
      productIdValid: mongoose.Types.ObjectId.isValid(finalProductId)
    });

    if (!finalProductId) {
      return res.status(400).json({ message: 'ProductId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(finalProductId)) {
      return res.status(400).json({ message: 'Invalid productId format' });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0 || participants.length > 3) {
      return res.status(400).json({ message: 'Participants must be an array with 1-3 emails.' });
    }

    // Validate participant emails
    for (const email of participants) {
      if (typeof email !== 'string' || !email.includes('@') || email.trim() === '') {
        return res.status(400).json({ message: `Invalid participant email: ${email}` });
      }
    }

    // Get product details
    const product = await Product.findById(finalProductId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productPrice = product.salePrice > 0 ? product.salePrice : product.retailPrice;
    const shippingCost = 10; // Fixed shipping cost
    const totalAmount = (productPrice * quantity) + shippingCost;
    const participantCount = participants.length + 1; // +1 for the creator
    const shareAmount = Math.round((totalAmount / participantCount) * 100) / 100; // Round to 2 decimal places

    const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    // Generate unique payment links for each participant
    const participantsWithLinks = participants.map(email => ({
      email: email.trim().toLowerCase(),
      paymentLink: generatePaymentLink(),
    }));

    const collaborativePurchase = await CollaborativePurchase.create({
      product: finalProductId,
      productName: product.name,
      productPrice: productPrice,
      quantity,
      totalAmount,
      shareAmount,
      createdBy: req.user._id,
      participants: participantsWithLinks,
      deadline,
    });

    // Send invitation emails to participants
    for (const participant of participantsWithLinks) {
      await sendInvitationEmail(participant.email, participant.paymentLink, {
        productName: product.name,
        productPrice: productPrice,
        shareAmount,
        deadline,
        createdBy: req.user,
        collaborativePurchaseId: collaborativePurchase._id,
      });
    }

    // Send confirmation email to creator
    await sendCreatorConfirmationEmail(req.user.email, {
      productName: product.name,
      productPrice: productPrice,
      shareAmount,
      deadline,
      participants: participantsWithLinks,
      collaborativePurchaseId: collaborativePurchase._id,
    });

    res.status(201).json({ 
      success: true, 
      collaborativePurchase,
      message: 'Collaborative purchase created successfully. Invitations sent to participants.'
    });

  } catch (err) {
    console.error('Error in createCollaborativePurchase:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Get collaborative purchase details
const getCollaborativePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const collaborativePurchase = await CollaborativePurchase.findById(id)
      .populate('product')
      .populate('createdBy', 'firstName lastName email')
      .populate('orderId');

    if (!collaborativePurchase) {
      return res.status(404).json({ message: 'Collaborative purchase not found' });
    }

    res.json({ success: true, collaborativePurchase });
  } catch (err) {
    console.error('Error in getCollaborativePurchase:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Get collaborative purchase by payment link
const getCollaborativePurchaseByPaymentLink = async (req, res) => {
  try {
    const { paymentLink } = req.params;
    const collaborativePurchase = await CollaborativePurchase.findOne({
      'participants.paymentLink': paymentLink
    })
      .populate('product')
      .populate('createdBy', 'firstName lastName email');

    if (!collaborativePurchase) {
      return res.status(404).json({ message: 'Collaborative purchase not found' });
    }

    // Find the specific participant
    const participant = collaborativePurchase.participants.find(p => p.paymentLink === paymentLink);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json({ 
      success: true, 
      collaborativePurchase,
      participant,
      timeRemaining: Math.max(0, collaborativePurchase.deadline - new Date())
    });
  } catch (err) {
    console.error('Error in getCollaborativePurchaseByPaymentLink:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Process payment for a participant
const processPayment = async (req, res) => {
  try {
    const { paymentLink } = req.params;
    const { paymentIntentId, email } = req.body;

    const collaborativePurchase = await CollaborativePurchase.findOne({
      'participants.paymentLink': paymentLink
    });

    if (!collaborativePurchase) {
      return res.status(404).json({ message: 'Collaborative purchase not found' });
    }

    const participant = collaborativePurchase.participants.find(p => p.paymentLink === paymentLink);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    if (participant.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    if (collaborativePurchase.status !== 'pending') {
      return res.status(400).json({ message: 'Collaborative purchase is no longer active' });
    }

    // Check if deadline has passed
    if (new Date() > collaborativePurchase.deadline) {
      collaborativePurchase.status = 'expired';
      await collaborativePurchase.save();
      return res.status(400).json({ message: 'Payment deadline has passed' });
    }

    // Update participant payment status
    participant.paymentStatus = 'paid';
    participant.paidAt = new Date();
    participant.paymentIntentId = paymentIntentId;

    // Check if all participants have paid
    const allPaid = collaborativePurchase.participants.every(p => p.paymentStatus === 'paid');
    
    if (allPaid) {
      // Create the actual order
      const order = await createOrderFromCollaborativePurchase(collaborativePurchase);
      collaborativePurchase.status = 'completed';
      collaborativePurchase.completedAt = new Date();
      collaborativePurchase.orderId = order._id;
      
      // Send completion notifications
      await sendCompletionNotifications(collaborativePurchase, order);
    }

    await collaborativePurchase.save();

    res.json({ 
      success: true, 
      collaborativePurchase,
      allPaid,
      message: allPaid ? 'All payments completed! Order has been placed.' : 'Payment processed successfully.'
    });

  } catch (err) {
    console.error('Error in processPayment:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Decline participation
const declineParticipation = async (req, res) => {
  try {
    const { paymentLink } = req.params;
    const { email } = req.body;

    const collaborativePurchase = await CollaborativePurchase.findOne({
      'participants.paymentLink': paymentLink
    });

    if (!collaborativePurchase) {
      return res.status(404).json({ message: 'Collaborative purchase not found' });
    }

    const participant = collaborativePurchase.participants.find(p => p.paymentLink === paymentLink);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    participant.paymentStatus = 'declined';
    collaborativePurchase.status = 'cancelled';
    collaborativePurchase.cancelledAt = new Date();

    await collaborativePurchase.save();

    // Send cancellation notifications
    await sendCancellationNotifications(collaborativePurchase);

    res.json({ 
      success: true, 
      collaborativePurchase,
      message: 'Participation declined. Collaborative purchase cancelled.'
    });

  } catch (err) {
    console.error('Error in declineParticipation:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Get user's collaborative purchases
const getUserCollaborativePurchases = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const collaborativePurchases = await CollaborativePurchase.find({
      $or: [
        { createdBy: userId },
        { 'participants.email': userEmail }
      ]
    })
      .populate('product')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, collaborativePurchases });
  } catch (err) {
    console.error('Error in getUserCollaborativePurchases:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Cancel collaborative purchase (creator only)
const cancelCollaborativePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const collaborativePurchase = await CollaborativePurchase.findById(id);
    if (!collaborativePurchase) {
      return res.status(404).json({ message: 'Collaborative purchase not found' });
    }

    if (collaborativePurchase.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the creator can cancel this collaborative purchase' });
    }

    if (collaborativePurchase.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel completed or already cancelled purchase' });
    }

    collaborativePurchase.status = 'cancelled';
    collaborativePurchase.cancelledAt = new Date();

    await collaborativePurchase.save();

    // Process refunds for paid participants
    await processRefunds(collaborativePurchase);

    // Send cancellation notifications
    await sendCancellationNotifications(collaborativePurchase);

    res.json({ 
      success: true, 
      collaborativePurchase,
      message: 'Collaborative purchase cancelled. Refunds processed for paid participants.'
    });

  } catch (err) {
    console.error('Error in cancelCollaborativePurchase:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Helper functions
const generatePaymentLink = () => {
  return crypto.randomBytes(32).toString('hex');
};

const createOrderFromCollaborativePurchase = async (collaborativePurchase) => {
  const order = await Order.create({
    user: collaborativePurchase.createdBy,
    items: [{
      product: collaborativePurchase.product,
      quantity: collaborativePurchase.quantity,
      price: collaborativePurchase.productPrice
    }],
    totalAmount: collaborativePurchase.totalAmount,
    status: 'confirmed',
    paymentStatus: 'paid',
    shippingAddress: {
      // You might want to collect this from the creator
      street: 'Default Address',
      city: 'Default City',
      state: 'Default State',
      zipCode: '00000',
      country: 'Default Country'
    },
    collaborativePurchase: collaborativePurchase._id
  });

  return order;
};

const sendInvitationEmail = async (email, paymentLink, data) => {
  const { productName, productPrice, shareAmount, deadline, createdBy, collaborativePurchaseId } = data;
  
  await transporter.sendMail({
    from: `"BEST WISHES" <${process.env.EMAIL}>`,
    to: email,
    subject: `🎁 You're Invited to a Collaborative Purchase!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Collaborative Purchase Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px;">
                  <tr>
                    <td align="center">
                      <h2 style="color: #6B46C1; margin: 0 0 20px;">🎁 Collaborative Purchase Invitation</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 16px; color: #333;">
                      <p style="margin: 0 0 10px;">Hi there 👋,</p>
                      <p style="margin: 0 0 10px;">You've been invited by <strong>${createdBy.firstName || createdBy.email}</strong> to participate in a collaborative purchase:</p>
                      <p style="margin: 0 0 10px;"><strong>${productName}</strong></p>
                      <p style="margin: 0 0 10px;">Total Price: <strong>$${productPrice.toFixed(2)}</strong></p>
                      <p style="margin: 0 0 10px;">Your Share: <strong>$${shareAmount.toFixed(2)}</strong></p>
                      <p style="margin: 0 0 20px;">Deadline: <strong>${deadline.toDateString()}</strong></p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a href="${process.env.FRONTEND_URL}/collaborative-payment/${paymentLink}"
                         style="background-color: #6B46C1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; display: inline-block;">
                        💳 Pay Your Share
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #555; padding-top: 10px;">
                      <p style="margin: 0;">If you're unable to participate, you can decline the invitation. The purchase will only proceed if all participants pay within the deadline.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 30px 0 0;">
                      <hr style="border: none; border-top: 1px solid #eee; width: 100%;" />
                      <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        💜 Best Wishes Team<br/>
                        <a href="${process.env.FRONTEND_URL}" style="color: #6B46C1; text-decoration: none;">Visit Our Platform</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  });
};

const sendCreatorConfirmationEmail = async (email, data) => {
  const { productName, productPrice, shareAmount, deadline, participants, collaborativePurchaseId } = data;
  
  await transporter.sendMail({
    from: `"BEST WISHES" <${process.env.EMAIL}>`,
    to: email,
    subject: `✅ Collaborative Purchase Created Successfully!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Collaborative Purchase Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px;">
                  <tr>
                    <td align="center">
                      <h2 style="color: #6B46C1; margin: 0 0 20px;">✅ Collaborative Purchase Created</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 16px; color: #333;">
                      <p style="margin: 0 0 10px;">Hello!</p>
                      <p style="margin: 0 0 10px;">Your collaborative purchase has been created successfully:</p>
                      <p style="margin: 0 0 10px;"><strong>${productName}</strong></p>
                      <p style="margin: 0 0 10px;">Total Price: <strong>$${productPrice.toFixed(2)}</strong></p>
                      <p style="margin: 0 0 10px;">Your Share: <strong>$${shareAmount.toFixed(2)}</strong></p>
                      <p style="margin: 0 0 10px;">Participants: <strong>${participants.length + 1}</strong></p>
                      <p style="margin: 0 0 20px;">Deadline: <strong>${deadline.toDateString()}</strong></p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a href="${process.env.FRONTEND_URL}/dashboard/collaborative-purchases"
                         style="background-color: #6B46C1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; display: inline-block;">
                        📊 Track Progress
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #555; padding-top: 10px;">
                      <p style="margin: 0;">You can track the progress of your collaborative purchase in your dashboard. All participants have been notified and have 3 days to complete their payments.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  });
};

const sendCompletionNotifications = async (collaborativePurchase, order) => {
  // Send completion email to all participants
  const allEmails = [
    collaborativePurchase.createdBy.email,
    ...collaborativePurchase.participants.map(p => p.email)
  ];

  for (const email of allEmails) {
    await transporter.sendMail({
      from: `"BEST WISHES" <${process.env.EMAIL}>`,
      to: email,
      subject: `🎉 Collaborative Purchase Completed!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Purchase Completed</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px;">
                    <tr>
                      <td align="center">
                        <h2 style="color: #6B46C1; margin: 0 0 20px;">🎉 Purchase Completed!</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 16px; color: #333;">
                        <p style="margin: 0 0 10px;">Great news! All participants have completed their payments.</p>
                        <p style="margin: 0 0 10px;"><strong>${collaborativePurchase.productName}</strong> has been ordered successfully!</p>
                        <p style="margin: 0 0 10px;">Order ID: <strong>${order._id}</strong></p>
                        <p style="margin: 0 0 20px;">Thank you for participating in this collaborative purchase!</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    });
  }
};

const sendCancellationNotifications = async (collaborativePurchase) => {
  // Send cancellation email to all participants
  const allEmails = [
    collaborativePurchase.createdBy.email,
    ...collaborativePurchase.participants.map(p => p.email)
  ];

  for (const email of allEmails) {
    await transporter.sendMail({
      from: `"BEST WISHES" <${process.env.EMAIL}>`,
      to: email,
      subject: `❌ Collaborative Purchase Cancelled`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Purchase Cancelled</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px;">
                    <tr>
                      <td align="center">
                        <h2 style="color: #6B46C1; margin: 0 0 20px;">❌ Purchase Cancelled</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 16px; color: #333;">
                        <p style="margin: 0 0 10px;">The collaborative purchase for <strong>${collaborativePurchase.productName}</strong> has been cancelled.</p>
                        <p style="margin: 0 0 10px;">If you had already paid, your refund will be processed within 5-7 business days.</p>
                        <p style="margin: 0 0 20px;">Thank you for your understanding.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    });
  }
};

const processRefunds = async (collaborativePurchase) => {
  // This would integrate with your payment processor (Stripe) to process refunds
  // For now, we'll just mark the participants as refunded
  for (const participant of collaborativePurchase.participants) {
    if (participant.paymentStatus === 'paid') {
      participant.paymentStatus = 'refunded';
      participant.refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  collaborativePurchase.status = 'refunded';
  await collaborativePurchase.save();
};

module.exports = {
  createCollaborativePurchase,
  getCollaborativePurchase,
  getCollaborativePurchaseByPaymentLink,
  processPayment,
  declineParticipation,
  getUserCollaborativePurchases,
  cancelCollaborativePurchase,
};
