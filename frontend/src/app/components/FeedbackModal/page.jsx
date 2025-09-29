"use client";
import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';
import Image from 'next/image';

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  product, 
  order,
  onFeedbackSubmitted 
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Handle star rating
  const handleStarClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleStarHover = (rating) => {
    setHoveredStar(rating);
  };

  // Handle text inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback`,
        {
          productId: product._id,
          orderId: order._id,
          rating: formData.rating,
          title: formData.title.trim(),
          comment: formData.comment.trim()
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Feedback submitted successfully!');
        onFeedbackSubmitted && onFeedbackSubmitted(response.data.feedback);
        onClose();
        
        // Reset form
        setFormData({
          rating: 0,
          title: '',
          comment: ''
        });
      }

    } catch (error) {
      console.error('Submit feedback error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get product image
  const getProductImage = () => {
    if (product?.images && product.images.length > 0) {
      if (typeof product.images[0] === 'object' && product.images[0].url) {
        return product.images[0].url;
      }
      return product.images[0];
    }
    return '/placeholder.svg';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Write a Review</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl p-1"
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <Image
            src={getProductImage()}
            alt={product?.name || "Product"}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
          <div>
            <h4 className="font-semibold text-gray-800">{product?.name}</h4>
            <p className="text-sm text-gray-600">
              Order Date: {new Date(order?.orderedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-colors"
                  disabled={loading}
                >
                  <FaStar
                    className={`text-2xl ${
                      star <= (hoveredStar || formData.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Summarize your review..."
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#822BE2] focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              placeholder="Tell us about your experience with this product..."
              maxLength={1000}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#822BE2] focus:border-transparent resize-vertical"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/1000 characters
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#822BE2] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;