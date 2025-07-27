import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, Calendar, DollarSign, Users, Clock, Search, Eye } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { getPropertyImageUrl, handleImageError } from "../utils/imageUtils";

const ProjectList = ({ userRole = "service_provider" }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    city: "",
    state: "",
    minBudget: "",
    maxBudget: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    totalProjects: 0,
  });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "residential", label: "Residential", icon: "🏠" },
    { value: "commercial", label: "Commercial", icon: "🏢" },
    { value: "industrial", label: "Industrial", icon: "🏭" },
    { value: "infrastructure", label: "Infrastructure", icon: "🌉" },
    { value: "renovation", label: "Renovation", icon: "🔨" },
    { value: "other", label: "Other", icon: "📋" },
  ];

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...filters,
      });

      // Add myProjects parameter for project owners
      if (userRole === "project_owner") {
        params.append("myProjects", "true");
      }

      const response = await axios.get(`http://localhost:5000/api/projects?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log(response.data);

      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters, userRole]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    fetchProjects(page);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.icon : "📋";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{userRole === "project_owner" ? "My Projects" : "Browse Projects"}</h1>
            <p className="text-gray-600 mt-2">{userRole === "project_owner" ? "Manage your construction projects" : "Find construction projects to bid on"}</p>
          </div>
          {userRole === "project_owner" && (
            <Link to="/create-project" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Create Project
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min Budget */}
            <div>
              <input
                type="number"
                placeholder="Min Budget"
                value={filters.minBudget}
                onChange={(e) => handleFilterChange("minBudget", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Budget */}
            <div>
              <input
                type="number"
                placeholder="Max Budget"
                value={filters.maxBudget}
                onChange={(e) => handleFilterChange("maxBudget", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">{userRole === "project_owner" ? "Create your first project to get started" : "No projects match your current filters"}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Project Image */}
                <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                  {project.files?.propertyImages?.length > 0 ? (
                    <img
                      src={getPropertyImageUrl(project.files.propertyImages[0])}
                      alt={project.title}
                      className="w-full h-full object-cover rounded-t-lg hover:scale-105 transition-transform duration-300"
                      // onError={(e) => handleImageError(e, "icon")}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${project.files?.propertyImages?.length > 0 ? "hidden" : ""}`}>
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getCategoryIcon(project.category)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>{project.status.replace("_", " ").toUpperCase()}</span>
                    </div>
                    <Link to={`/project/${project._id}`} className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{project.title}</h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  {/* Location */}
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {project.location.city}, {project.location.state}
                    </span>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>
                      {formatCurrency(project.budget.min)} - {formatCurrency(project.budget.max)}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{project.timeline.estimatedDuration} days</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{project.bidCount || 0} bids</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{project.daysUntilDeadline} days left</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    <Link to={`/project/${project._id}`} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center block">
                      {userRole === "project_owner" ? "View Details" : "View & Bid"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.total }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-md ${
                      page === pagination.current ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.total}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectList;
