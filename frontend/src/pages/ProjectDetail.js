import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  FileText,
  Download,
  Eye,
  MessageSquare,
  ArrowLeft,
  Star,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getPropertyImageUrl, handleImageError } from "../utils/imageUtils";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: "",
    timeline: "",
    message: "",
  });
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProject(response.data.project);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!bidForm.amount || !bidForm.timeline) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmittingBid(true);
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("amount", bidForm.amount);
      formData.append("timeline", bidForm.timeline);
      formData.append("message", bidForm.message);

      await axios.post("http://localhost:5000/api/bids", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Bid submitted successfully!");
      setShowBidForm(false);
      setBidForm({ amount: "", timeline: "", message: "" });
      fetchProjectDetails(); // Refresh to show updated bid count
    } catch (error) {
      console.error("Error submitting bid:", error);
      const message = error.response?.data?.message || "Failed to submit bid";
      toast.error(message);
    } finally {
      setSubmittingBid(false);
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
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?._id === project?.owner?._id;
  const isServiceProvider = user?.role === "service_provider";
  const canBid = isServiceProvider && project?.status === "live" && !isOwner;
  const hasBid = project?.bids?.some((bid) => bid.serviceProvider._id === user?._id);
  const canMessage = !isOwner && project?.owner?._id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-sm text-gray-600">
                  {getCategoryIcon(project.category)} {project.category.charAt(0).toUpperCase() + project.category.slice(1)} Project
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>{project.status.replace("_", " ").toUpperCase()}</span>
              {canBid && !hasBid && (
                <button onClick={() => setShowBidForm(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Place Bid
                </button>
              )}
              {canMessage && project.owner?._id && (
                <Link
                  to={`/messages?projectId=${project._id}&recipientId=${project.owner._id}`}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isServiceProvider ? "Message Owner" : "Message Service Provider"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Overview</h2>
              <p className="text-gray-700 mb-6">{project.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-600">
                      {project.location.address}, {project.location.city}, {project.location.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Budget Range</p>
                    <p className="text-gray-600">
                      {formatCurrency(project.budget.min)} - {formatCurrency(project.budget.max)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Timeline</p>
                    <p className="text-gray-600">
                      {formatDate(project.timeline.startDate)} - {formatDate(project.timeline.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Duration</p>
                    <p className="text-gray-600">{project.timeline.estimatedDuration} days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Files */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Files</h2>

              {/* Property Images */}
              {project.files?.propertyImages?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Property Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {project.files.propertyImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getPropertyImageUrl(file)}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                          // onError={(e) => handleImageError(e, "placeholder")}
                        />
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center hidden">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 text-white">
                            <Eye className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOQ Files */}
              {project.files?.boq?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Bill of Quantities (BOQ)</h3>
                  <div className="space-y-2">
                    {project.files.boq.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-gray-900">{file.originalName}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawings */}
              {project.files?.drawings?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Drawings & Designs</h3>
                  <div className="space-y-2">
                    {project.files.drawings.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <span className="text-gray-900">{file.originalName}</span>
                        </div>
                        <button className="text-green-600 hover:text-green-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Documents */}
              {project.files?.otherDocuments?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Other Documents</h3>
                  <div className="space-y-2">
                    {project.files.otherDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <span className="text-gray-900">{file.originalName}</span>
                        </div>
                        <button className="text-purple-600 hover:text-purple-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-medium text-gray-900">Area</p>
                  <p className="text-gray-600">{project.specifications.area} sq ft</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Floors</p>
                  <p className="text-gray-600">{project.specifications.floors}</p>
                </div>
                {project.specifications.specialRequirements && (
                  <div className="md:col-span-2">
                    <p className="font-medium text-gray-900">Special Requirements</p>
                    <p className="text-gray-600">{project.specifications.specialRequirements}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Owner Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Owner</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {project.owner?.firstName?.charAt(0) || "U"}
                    {project.owner?.lastName?.charAt(0) || "S"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {project.owner?.firstName || "Unknown"} {project.owner?.lastName || "User"}
                  </p>
                  <p className="text-sm text-gray-600">{project.owner?.email || "No email available"}</p>
                </div>
              </div>
              {canMessage && project.owner?._id && (
                <div className="space-y-2">
                  <Link
                    to={`/messages?projectId=${project._id}&recipientId=${project.owner._id}`}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Bidding Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bidding Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bids Received</span>
                  <span className="font-semibold text-gray-900">{project.bidCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Deadline</span>
                  <span className="font-semibold text-gray-900">{formatDate(project.biddingDeadline)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Days Left</span>
                  <span className={`font-semibold ${project.daysUntilDeadline > 7 ? "text-green-600" : project.daysUntilDeadline > 3 ? "text-yellow-600" : "text-red-600"}`}>
                    {project.daysUntilDeadline} days
                  </span>
                </div>
              </div>

              {canBid && !hasBid && (
                <button onClick={() => setShowBidForm(true)} className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                  Place Your Bid
                </button>
              )}

              {hasBid && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Bid Submitted</span>
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Architect */}
            {project.assignedArchitect && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Architect</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {project.assignedArchitect?.firstName?.charAt(0) || "A"}
                        {project.assignedArchitect?.lastName?.charAt(0) || "R"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {project.assignedArchitect?.firstName || "Unknown"} {project.assignedArchitect?.lastName || "Architect"}
                      </p>
                      <p className="text-sm text-gray-600">{project.assignedArchitect?.email || "No email available"}</p>
                    </div>
                  </div>
                  <Link
                    to={`/messages?projectId=${project._id}&recipientId=${project.assignedArchitect?._id}`}
                    className="inline-flex items-center px-3 py-1 text-green-600 hover:text-green-700 text-sm border border-green-200 rounded-md hover:bg-green-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Bid</h3>
            <form onSubmit={handleBidSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (USD) *</label>
                <input
                  type="number"
                  value={bidForm.amount}
                  onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your bid amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (Days) *</label>
                <input
                  type="number"
                  value={bidForm.timeline}
                  onChange={(e) => setBidForm({ ...bidForm, timeline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Estimated completion time"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea
                  value={bidForm.message}
                  onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a message to your bid..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowBidForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submittingBid} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submittingBid ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
