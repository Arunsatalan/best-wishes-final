"use client";
import React, { useEffect, useState } from 'react';
import { FaStar, FaThumbsUp, FaThumbsDown, FaUser } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import axios from 'axios';
import Image from 'next/image';

const ProductReviews = ({ productId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalFeedbacks: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    rating: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch feedbacks
  const fetchFeedbacks = async (page = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        verified: 'true'
      });

      if (filters.rating !== 'all') {
        params.append('rating', filters.rating);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/feedback/product/${productId}?${params}`
      );

      if (response.data.success) {
        const newFeedbacks = response.data.feedbacks;
        
        if (reset || page === 1) {
          setFeedbacks(newFeedbacks);
        } else {
          setFeedbacks(prev => [...prev, ...newFeedbacks]);
        }

        setRatingStats(response.data.ratingStats);
        setHasMore(response.data.pagination.hasNextPage);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchFeedbacks(1, true);
    }
  }, [productId, filters]);

  // Render stars
  const renderStars = (rating, size = 'text-sm') => {
    return (
      <div className={`flex items-center ${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution
  const renderRatingDistribution = () => {
    if (ratingStats.totalFeedbacks === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingStats.ratingDistribution[rating] || 0;
          const percentage = ratingStats.totalFeedbacks > 0 
            ? (count / ratingStats.totalFeedbacks) * 100 
            : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-8">{rating}</span>
              <FaStar className="text-yellow-400 w-3 h-3" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-600">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Load more feedbacks
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchFeedbacks(currentPage + 1, false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (!productId) return null;

  return (
    <div className="w-full mt-8 space-y-6">
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>
        
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {ratingStats.averageRating.toFixed(1)}
            </div>
            <div className="mb-2">
              {renderStars(Math.round(ratingStats.averageRating), 'text-lg')}
            </div>
            <div className="text-sm text-gray-600">
              Based on {ratingStats.totalFeedbacks} review{ratingStats.totalFeedbacks !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-4">Rating Breakdown</h4>
            {renderRatingDistribution()}
          </div>
        </div>

        {/* Filters */}
        {ratingStats.totalFeedbacks > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter by rating:</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="createdAt">Newest</option>
                <option value="rating">Rating</option>
                <option value="likes">Most helpful</option>
              </select>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {loading && feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading reviews...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-xl font-medium mb-2">No reviews yet</h4>
              <p>Be the first to review this product!</p>
            </div>
          ) : (
            <>
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border-b border-gray-200 pb-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {feedback.user?.profile?.avatar ? (
                          <Image
                            src={feedback.user.profile.avatar}
                            alt={feedback.user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <FaUser className="text-purple-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {feedback.user?.name || 'Anonymous'}
                          </span>
                          {feedback.isVerifiedPurchase && (
                            <div className="flex items-center gap-1 text-green-600 text-xs">
                              <MdVerified />
                              <span>Verified Purchase</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(feedback.rating)}
                          <span className="text-sm text-gray-600">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                          {feedback.isEdited && (
                            <span className="text-xs text-gray-500">(edited)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">{feedback.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{feedback.comment}</p>
                  </div>

                  {/* Review Images */}
                  {feedback.images && feedback.images.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {feedback.images.map((imageUrl, index) => (
                        <Image
                          key={index}
                          src={imageUrl}
                          alt={`Review image ${index + 1}`}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <FaThumbsUp className="w-3 h-3" />
                      <span>{feedback.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaThumbsDown className="w-3 h-3" />
                      <span>{feedback.dislikes || 0}</span>
                    </div>
                    {feedback.likes + feedback.dislikes > 0 && (
                      <span>
                        {Math.round((feedback.likes / (feedback.likes + feedback.dislikes)) * 100)}% found this helpful
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More Reviews'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;