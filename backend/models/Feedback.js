const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    type: String, // Cloudinary URLs
    default: []
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true // Since feedback can only be given on purchased products
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create compound index to ensure one feedback per user per product per order
feedbackSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Create indexes for efficient queries
feedbackSchema.index({ product: 1, status: 1 });
feedbackSchema.index({ user: 1 });
feedbackSchema.index({ createdAt: -1 });

// Pre-populate user and product details when fetching feedback
feedbackSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email profile'
  }).populate({
    path: 'product',
    select: 'name images price'
  });
  next();
});

// Virtual for getting total votes
feedbackSchema.virtual('totalVotes').get(function() {
  return this.likes + this.dislikes;
});

// Virtual for getting helpful ratio
feedbackSchema.virtual('helpfulRatio').get(function() {
  const total = this.likes + this.dislikes;
  return total > 0 ? (this.likes / total) * 100 : 0;
});

// Static method to get average rating for a product
feedbackSchema.statics.getAverageRating = async function(productId) {
  const pipeline = [
    {
      $match: { 
        product: new mongoose.Types.ObjectId(productId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  if (result.length > 0) {
    const data = result[0];
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    return {
      averageRating: Math.round(data.averageRating * 10) / 10, // Round to 1 decimal
      totalFeedbacks: data.totalFeedbacks,
      ratingDistribution: distribution
    };
  }
  
  return {
    averageRating: 0,
    totalFeedbacks: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Instance method to check if feedback can be edited
feedbackSchema.methods.canEdit = function() {
  const createdAt = new Date(this.createdAt);
  const now = new Date();
  const hoursSinceCreated = Math.abs(now - createdAt) / 36e5;
  
  // Allow editing within 24 hours of creation
  return hoursSinceCreated <= 24;
};

module.exports = mongoose.model('Feedback', feedbackSchema);