const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getProductFeedback,
  getUserFeedback,
  updateFeedback,
  deleteFeedback,
  checkFeedbackEligibility,
  getProductsFeedbackSummary
} = require('../controllers/feedbackController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Public routes
router.get('/product/:productId', getProductFeedback); // Get all feedback for a product
router.post('/products/summary', getProductsFeedbackSummary); // Get feedback summary for multiple products

// Protected routes (require authentication)
router.use(isAuthenticated); // Apply authentication middleware to all routes below

// User feedback management
router.post('/', createFeedback); // Create new feedback
router.get('/my-feedback', getUserFeedback); // Get user's own feedback
router.put('/:feedbackId', updateFeedback); // Update user's own feedback
router.delete('/:feedbackId', deleteFeedback); // Delete user's own feedback

// Check feedback eligibility
router.get('/eligibility/:productId/:orderId', checkFeedbackEligibility); // Check if user can give feedback

module.exports = router;