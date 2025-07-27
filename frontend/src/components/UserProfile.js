import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { Star, MapPin, Phone, Mail, Building2, Calendar, ThumbsUp, MessageSquare, Award, Shield, CheckCircle, XCircle } from "lucide-react";
import RatingForm from "./RatingForm";

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // First try to get user ratings and profile
      try {
        const response = await axios.get(`http://localhost:5000/api/ratings/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(response.data.user);
        setRatings(response.data);
        return;
      } catch (ratingsError) {
        console.log("Ratings endpoint failed, trying basic user endpoint:", ratingsError.message);
      }

      // Fallback: get basic user info
      const userResponse = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setUser(userResponse.data.user);
      setRatings({
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {},
        reviews: [],
        pagination: { current: 1, total: 0, totalReviews: 0 },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    fetchUserProfile(); // Refresh the profile
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-blue-600";
    if (rating >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingText = (rating) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.5) return "Good";
    if (rating >= 3.0) return "Fair";
    return "Poor";
  };

  const StarRating = ({ rating, size = "w-4 h-4" }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${size} ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const canRate = currentUser && currentUser._id !== userId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-2xl">
                  {user.firstName?.charAt(0) || "U"}
                  {user.lastName?.charAt(0) || "S"}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600 mb-4">{user.role === "project_owner" ? "Project Owner" : "Service Provider"}</p>

                {/* Rating Summary */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <StarRating rating={Math.round(ratings.averageRating)} size="w-5 h-5" />
                    <span className={`text-lg font-semibold ${getRatingColor(ratings.averageRating)}`}>{ratings.averageRating.toFixed(1)}</span>
                    <span className="text-gray-600">({ratings.totalRatings} reviews)</span>
                  </div>
                  <span className={`text-sm font-medium ${getRatingColor(ratings.averageRating)}`}>{getRatingText(ratings.averageRating)}</span>
                </div>

                {/* Contact Info */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {canRate && (
                <button onClick={() => setShowRatingForm(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Star className="w-4 h-4 mr-2" />
                  Rate User
                </button>
              )}
              <Link to={`/messages?recipientId=${user?._id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Link>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {ratings.ratingDistribution && ratings.ratingDistribution.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const distribution = ratings.ratingDistribution.find((d) => d._id === star);
                const count = distribution ? distribution.count : 0;
                const percentage = ratings.totalRatings > 0 ? (count / ratings.totalRatings) * 100 : 0;

                return (
                  <div key={star} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium text-gray-900">{star}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
          </div>

          {ratings.reviews && ratings.reviews.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {ratings.reviews.map((review) => (
                <div key={review._id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {review.rater.firstName?.charAt(0) || "U"}
                          {review.rater.lastName?.charAt(0) || "S"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {review.rater.firstName} {review.rater.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm font-medium text-gray-900">{review.rating}/5</span>
                    </div>
                  </div>

                  {review.project && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>Project: {review.project.title}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-gray-700 mb-3">{review.review}</p>

                  {/* Category Ratings */}
                  {review.categories && Object.keys(review.categories).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      {Object.entries(review.categories).map(([category, rating]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-gray-600 capitalize">{category}:</span>
                          <StarRating rating={rating} size="w-3 h-3" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpfulVotes || 0})</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-gray-700">Report</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reviews yet</p>
              <p className="text-sm">Be the first to review this user</p>
            </div>
          )}
        </div>
      </div>

      {/* Rating Form Modal */}
      {showRatingForm && (
        <RatingForm
          projectId={null} // No specific project context for profile ratings
          ratedUserId={userId}
          ratedUserName={`${user.firstName} ${user.lastName}`}
          ratingType="general"
          onSuccess={handleRatingSuccess}
          onCancel={() => setShowRatingForm(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
