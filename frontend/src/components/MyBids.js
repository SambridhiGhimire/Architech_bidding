import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { FileText, DollarSign, Clock, Calendar, Eye, CheckCircle, XCircle, AlertCircle, MapPin, Building2 } from "lucide-react";

const MyBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBids = useCallback(async () => {
    try {
      setLoading(true);
      // Use the dedicated endpoint for fetching user's bids
      const response = await axios.get("http://localhost:5000/api/bids/my-bids", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBids(response.data.bids);
    } catch (error) {
      console.error("Error fetching my bids:", error);
      toast.error("Failed to load your bids");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyBids();
    }
  }, [fetchMyBids]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      residential: "🏠",
      commercial: "🏢",
      industrial: "🏭",
      infrastructure: "🌉",
      renovation: "🔨",
      other: "📋",
    };
    return icons[category] || "📋";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Bids</h2>
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No bids submitted yet</p>
          <p className="text-sm mt-2">Start browsing projects to submit your first bid</p>
          <Link to="/dashboard" className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Building2 className="w-4 h-4 mr-2" />
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Bids ({bids.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Total Bids: {bids.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-600">Accepted: {bids.filter((bid) => bid.status === "accepted").length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-600">Pending: {bids.filter((bid) => bid.status === "pending").length}</span>
          </div>
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {bids.map((bid) => (
          <div key={bid._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              {/* Project Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{getCategoryIcon(bid.projectCategory)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bid.projectTitle}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {bid.projectLocation.city}, {bid.projectLocation.state}
                        </span>
                      </div>
                      <span className="capitalize">{bid.projectCategory}</span>
                    </div>
                  </div>
                </div>

                {/* Bid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">{formatCurrency(bid.amount)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{bid.timeline} days</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted {formatDate(bid.submittedAt)}</span>
                  </div>
                </div>

                {bid.message && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bid.message}</p>}

                {/* Project Owner */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Project Owner:</span>
                  <span className="font-medium">
                    {bid.projectOwner?.firstName || "Unknown"} {bid.projectOwner?.lastName || "User"}
                  </span>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-col items-end space-y-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(bid.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>{bid.status.toUpperCase()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Link to={`/project/${bid.projectId}`} className="inline-flex items-center px-3 py-1 text-blue-600 hover:text-blue-700 text-sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View Project
                  </Link>
                  {bid.status === "accepted" && bid.projectOwner?._id && (
                    <Link
                      to={`/messages?projectId=${bid.projectId}&recipientId=${bid.projectOwner._id}`}
                      className="inline-flex items-center px-3 py-1 text-green-600 hover:text-green-700 text-sm"
                      title="Message Project Owner"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Link>
                  )}
                </div>

                {/* Status-specific messages */}
                {bid.status === "accepted" && (
                  <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">🎉 Congratulations! Your bid was accepted. Contact the project owner to proceed.</div>
                )}

                {bid.status === "rejected" && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">Your bid was not selected for this project. Keep bidding on other projects!</div>
                )}

                {bid.status === "pending" && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">Your bid is under review. The project owner will notify you soon.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBids;
