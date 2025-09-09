const express = require('express');
const router = express.Router();
const collaborativePurchaseController = require('../controllers/collaborativePurchaseController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Create collaborative purchase
router.post('/', isAuthenticated, collaborativePurchaseController.createCollaborativePurchase);

// Get collaborative purchase details
router.get('/:id', isAuthenticated, collaborativePurchaseController.getCollaborativePurchase);

// Get collaborative purchase by payment link (public route for participants)
router.get('/payment/:paymentLink', collaborativePurchaseController.getCollaborativePurchaseByPaymentLink);

// Process payment for a participant
router.post('/payment/:paymentLink', collaborativePurchaseController.processPayment);

// Decline participation
router.post('/decline/:paymentLink', collaborativePurchaseController.declineParticipation);

// Get user's collaborative purchases
router.get('/', isAuthenticated, collaborativePurchaseController.getUserCollaborativePurchases);

// Cancel collaborative purchase (creator only)
router.post('/:id/cancel', isAuthenticated, collaborativePurchaseController.cancelCollaborativePurchase);

module.exports = router;
