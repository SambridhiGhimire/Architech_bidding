import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { Star, X, Send } from "lucide-react";

const RatingForm = ({ projectId, ratedUserId, ratedUserName, ratingType, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({
    communication: 0,
    quality: 0,
    timeliness: 0,
    professionalism: 0,
    value: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const categories = [
    { key: "communication", label: "Communication", description: "How well they communicated throughout the project" },
    { key: "quality", label: "Quality of Work", description: "The quality and craftsmanship of the work delivered" },
    { key: "timeliness", label: "Timeliness", description: "How well they met deadlines and timelines" },
    { key: "professionalism", label: "Professionalism", description: "Their professional conduct and behavior" },
    { key: "value", label: "Value for Money", description: "Whether the work was worth the cost" },
  ];

  const handleCategoryRating = (category, rating) => {
    setCategoryRatings((prev) => ({
      ...prev,
      [category]: rating,
    }));
  };

  const handleOverallRating = (rating) => {
    setOverallRating(rating);
  };

  const onSubmit = async (data) => {
    if (overallRating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    try {
      setIsSubmitting(true);

      const ratingData = {
        ratedUserId,
        rating: overallRating,
        review: data.review,
        ratingType,
        categories: categoryRatings,
      };

      // Only add projectId if it exists
      if (projectId) {
        ratingData.projectId = projectId;
      }

      const response = await axios.post("http://localhost:5000/api/ratings", ratingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Rating submitted successfully!");
      reset();
      setOverallRating(0);
      setCategoryRatings({
        communication: 0,
        quality: 0,
        timeliness: 0,
        professionalism: 0,
        value: 0,
      });

      if (onSuccess) {
        onSuccess(response.data.rating);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      const message = error.response?.data?.message || "Failed to submit rating";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, size = "w-5 h-5" }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className={`${size} transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400`}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rate {ratedUserName}</h2>
            <p className="text-sm text-gray-600">Share your experience working with {ratedUserName}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Overall Rating *</label>
            <div className="flex items-center space-x-4">
              <StarRating rating={overallRating} onRatingChange={handleOverallRating} size="w-8 h-8" />
              <span className="text-lg font-medium text-gray-900">{overallRating > 0 ? `${overallRating}/5` : "Select rating"}</span>
            </div>
          </div>

          {/* Category Ratings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Detailed Ratings (Optional)</label>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.label}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{categoryRatings[category.key] > 0 ? `${categoryRatings[category.key]}/5` : ""}</span>
                  </div>
                  <StarRating rating={categoryRatings[category.key]} onRatingChange={(rating) => handleCategoryRating(category.key, rating)} />
                </div>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              Review *
            </label>
            <textarea
              id="review"
              {...register("review", {
                required: "Review is required",
                minLength: {
                  value: 10,
                  message: "Review must be at least 10 characters",
                },
                maxLength: {
                  value: 1000,
                  message: "Review must be less than 1000 characters",
                },
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share your experience working with this person. What went well? What could be improved?"
            />
            {errors.review && <p className="mt-1 text-sm text-red-600">{errors.review.message}</p>}
            <p className="mt-1 text-sm text-gray-500">{register("review").value?.length || 0}/1000 characters</p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || overallRating === 0}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingForm;
