const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, images = [] } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!productId || !orderId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Order ID, rating, title, and comment are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Verify that the user has purchased this product in this order
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: { $in: ['Delivered', 'Processing', 'Shipped'] } // Only allow feedback for confirmed orders
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not eligible for feedback'
      });
    }

    // Check if the product exists in the order
    const productInOrder = order.items.some(item => 
      item.product && item.product.toString() === productId
    );

    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: 'Product not found in this order'
      });
    }

    // Check if feedback already exists for this user-product-order combination
    const existingFeedback = await Feedback.findOne({
      user: userId,
      product: productId,
      order: orderId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already provided feedback for this product in this order'
      });
    }

    // Create new feedback
    const feedback = new Feedback({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      title,
      comment,
      images: images ? images.filter(img => img && img.trim() !== '') : [] // Filter out empty images, default to empty array
    });

    await feedback.save();

    // Populate the feedback with user and product details
    await feedback.populate([
      { path: 'user', select: 'name email profile' },
      { path: 'product', select: 'name images price' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      feedback
    });

  } catch (error) {
    console.error('Create feedback error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already provided feedback for this product in this order'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating feedback',
      error: error.message
    });
  }
};

// Get feedback for a specific product
exports.getProductFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      rating,
      verified = true 
    } = req.query;

    const query = { 
      product: productId,
      status: 'active'
    };

    // Filter by rating if specified
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    // Filter by verified purchases
    if (verified === 'true') {
      query.isVerifiedPurchase = true;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const feedbacks = await Feedback.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name profile')
      .populate('product', 'name images price');

    const totalFeedbacks = await Feedback.countDocuments(query);

    // Get average rating and distribution
    const ratingStats = await Feedback.getAverageRating(productId);

    res.json({
      success: true,
      feedbacks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFeedbacks / limit),
        totalFeedbacks,
        hasNextPage: page * limit < totalFeedbacks,
        hasPreviousPage: page > 1
      },
      ratingStats
    });

  } catch (error) {
    console.error('Get product feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product feedback',
      error: error.message
    });
  }
};

// Get user's feedback
exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const feedbacks = await Feedback.find({ user: userId })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('product', 'name images price')
      .populate('order', 'orderedAt status');

    const totalFeedbacks = await Feedback.countDocuments({ user: userId });

    res.json({
      success: true,
      feedbacks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFeedbacks / limit),
        totalFeedbacks,
        hasNextPage: page * limit < totalFeedbacks,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user feedback',
      error: error.message
    });
  }
};

// Update feedback (only by the author and within 24 hours)
exports.updateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user.id;

    const feedback = await Feedback.findOne({
      _id: feedbackId,
      user: userId
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or not authorized to update'
      });
    }

    // Check if feedback can still be edited
    if (!feedback.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be edited within 24 hours of creation'
      });
    }

    // Update fields if provided
    if (rating && rating >= 1 && rating <= 5) {
      feedback.rating = rating;
    }
    if (title) feedback.title = title;
    if (comment) feedback.comment = comment;
    if (images) feedback.images = images.filter(img => img && img.trim() !== '');

    // Mark as edited
    feedback.isEdited = true;
    feedback.editedAt = new Date();

    await feedback.save();

    await feedback.populate([
      { path: 'user', select: 'name email profile' },
      { path: 'product', select: 'name images price' }
    ]);

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
};

// Delete feedback (only by the author)
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.user.id;

    const feedback = await Feedback.findOne({
      _id: feedbackId,
      user: userId
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or not authorized to delete'
      });
    }

    await Feedback.findByIdAndDelete(feedbackId);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
};

// Check if user can give feedback for a product in an order
exports.checkFeedbackEligibility = async (req, res) => {
  try {
    const { productId, orderId } = req.params;
    const userId = req.user.id;

    // Check if order exists and user owns it
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: { $in: ['Delivered', 'Processing', 'Shipped'] }
    });

    if (!order) {
      return res.json({
        success: false,
        canGiveFeedback: false,
        reason: 'Order not found or not eligible for feedback'
      });
    }

    // Check if product exists in order
    const productInOrder = order.items.some(item => 
      item.product && item.product.toString() === productId
    );

    if (!productInOrder) {
      return res.json({
        success: false,
        canGiveFeedback: false,
        reason: 'Product not found in this order'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      user: userId,
      product: productId,
      order: orderId
    });

    if (existingFeedback) {
      return res.json({
        success: true,
        canGiveFeedback: false,
        reason: 'Feedback already provided',
        existingFeedback: {
          id: existingFeedback._id,
          rating: existingFeedback.rating,
          title: existingFeedback.title,
          comment: existingFeedback.comment,
          canEdit: existingFeedback.canEdit(),
          createdAt: existingFeedback.createdAt
        }
      });
    }

    res.json({
      success: true,
      canGiveFeedback: true,
      reason: 'Eligible to provide feedback'
    });

  } catch (error) {
    console.error('Check feedback eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking feedback eligibility',
      error: error.message
    });
  }
};

// Get feedback summary for multiple products
exports.getProductsFeedbackSummary = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    const summaries = await Promise.all(
      productIds.map(async (productId) => {
        const stats = await Feedback.getAverageRating(productId);
        return {
          productId,
          ...stats
        };
      })
    );

    res.json({
      success: true,
      summaries
    });

  } catch (error) {
    console.error('Get products feedback summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products feedback summary',
      error: error.message
    });
  }
};

module.exports = exports;