import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, DollarSign, Clock, Calendar, CheckCircle, XCircle, Eye, Star, Phone, Mail, FileText, Download, MessageSquare } from "lucide-react";
import RatingForm from "./RatingForm";

const BidList = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showBidDetail, setShowBidDetail] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedBidForRating, setSelectedBidForRating] = useState(null);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      // For now, we'll need to fetch all projects and their bids
      // This is a temporary solution until we have a dedicated endpoint
      const response = await axios.get("http://localhost:5000/api/projects?myProjects=true", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Extract all bids from all projects
      const allBids = [];
      response.data.projects.forEach((project) => {
        if (project.bids && project.bids.length > 0) {
          project.bids.forEach((bid) => {
            allBids.push({
              ...bid,
              projectTitle: project.title,
              projectId: project._id,
            });
          });
        }
      });

      setBids(allBids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      toast.error("Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId, projectId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/bids/${projectId}/${bidId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Bid accepted successfully!");
      fetchBids(); // Refresh the list
    } catch (error) {
      console.error("Error accepting bid:", error);
      toast.error("Failed to accept bid");
    }
  };

  const handleRejectBid = async (bidId, projectId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/bids/${projectId}/${bidId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Bid rejected");
      fetchBids(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting bid:", error);
      toast.error("Failed to reject bid");
    }
  };

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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bids Received</h2>
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No bids received yet</p>
          <p className="text-sm mt-2">Bids will appear here once contractors submit their proposals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bids Received ({bids.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Total Bids: {bids.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Average: {formatCurrency(bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Avg Timeline: {Math.round(bids.reduce((sum, bid) => sum + bid.timeline, 0) / bids.length)} days</span>
          </div>
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {bids.map((bid) => (
          <div key={bid._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              {/* Bidder Info */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {bid.serviceProvider?.firstName?.charAt(0) || "U"}
                    {bid.serviceProvider?.lastName?.charAt(0) || "S"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {bid.serviceProvider?.firstName || "Unknown"} {bid.serviceProvider?.lastName || "User"}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}>{bid.status.toUpperCase()}</span>
                    <Link to={`/user/${bid.serviceProvider._id}`} className="text-blue-600 hover:text-blue-700 text-sm">
                      View Profile
                    </Link>
                  </div>

                  <div className="text-sm text-gray-500 mb-2">Project: {bid.projectTitle}</div>

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
                      <span>{formatDate(bid.submittedAt)}</span>
                    </div>
                  </div>

                  {bid.message && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bid.message}</p>}

                  {/* Bidder Details */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Star className="w-4 h-4" />
                      <span>4.5 (12 reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>15 projects completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedBid(bid);
                    setShowBidDetail(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="View Details"
                >
                  <Eye className="w-5 h-5" />
                </button>

                {bid.status === "pending" && (
                  <>
                    <button onClick={() => handleAcceptBid(bid._id, bid.projectId)} className="p-2 text-green-600 hover:text-green-700" title="Accept Bid">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleRejectBid(bid._id, bid.projectId)} className="p-2 text-red-600 hover:text-red-700" title="Reject Bid">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
                {bid.status === "accepted" && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedBidForRating(bid);
                        setShowRatingForm(true);
                      }}
                      className="p-2 text-yellow-600 hover:text-yellow-700"
                      title="Rate Service Provider"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                    {bid.serviceProvider?._id && (
                      <Link
                        to={`/messages?projectId=${bid.projectId}&recipientId=${bid.serviceProvider._id}`}
                        className="p-2 text-blue-600 hover:text-blue-700"
                        title="Message Service Provider"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bid Detail Modal */}
      {showBidDetail && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bid Details</h3>
              <button onClick={() => setShowBidDetail(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Bidder Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {selectedBid.serviceProvider?.firstName?.charAt(0) || "U"}
                    {selectedBid.serviceProvider?.lastName?.charAt(0) || "S"}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedBid.serviceProvider?.firstName || "Unknown"} {selectedBid.serviceProvider?.lastName || "User"}
                  </h4>
                  <p className="text-gray-600">{selectedBid.serviceProvider?.email || "No email available"}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>4.5 (12 reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>15 projects completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Bid Amount</h4>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedBid.amount)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <p className="text-2xl font-bold text-green-600">{selectedBid.timeline} days</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Submitted</h4>
                  <p className="text-gray-600">{formatDate(selectedBid.submittedAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBid.status)}`}>{selectedBid.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Message */}
              {selectedBid.message && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedBid.message}</p>
                </div>
              )}

              {/* Documents */}
              {selectedBid.documents && selectedBid.documents.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-2">
                    {selectedBid.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-gray-900">{doc.originalName}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                {selectedBid.serviceProvider?._id ? (
                  <Link
                    to={`/messages?projectId=${selectedBid.projectId}&recipientId=${selectedBid.serviceProvider._id}`}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setShowBidDetail(false)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </Link>
                ) : (
                  <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled>
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                )}
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>
              </div>

              {/* Accept/Reject Actions */}
              {selectedBid.status === "pending" && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleAcceptBid(selectedBid._id, selectedBid.projectId);
                      setShowBidDetail(false);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Accept Bid
                  </button>
                  <button
                    onClick={() => {
                      handleRejectBid(selectedBid._id, selectedBid.projectId);
                      setShowBidDetail(false);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                  >
                    Reject Bid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && selectedBidForRating && (
        <RatingForm
          projectId={selectedBidForRating.projectId}
          ratedUserId={selectedBidForRating.serviceProvider._id}
          ratedUserName={`${selectedBidForRating.serviceProvider.firstName} ${selectedBidForRating.serviceProvider.lastName}`}
          ratingType="owner_to_contractor"
          onSuccess={() => {
            setShowRatingForm(false);
            setSelectedBidForRating(null);
            fetchBids(); // Refresh the list
          }}
          onCancel={() => {
            setShowRatingForm(false);
            setSelectedBidForRating(null);
          }}
        />
      )}
    </div>
  );
};

export default BidList;
