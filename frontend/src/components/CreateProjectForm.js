import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Building2, Upload, X, MapPin, DollarSign, FileText, Image, File } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const CreateProjectForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    propertyImages: [],
    boq: [],
    drawings: [],
    otherDocuments: [],
  });
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const categories = [
    { value: "residential", label: "Residential", icon: "🏠" },
    { value: "commercial", label: "Commercial", icon: "🏢" },
    { value: "industrial", label: "Industrial", icon: "🏭" },
    { value: "infrastructure", label: "Infrastructure", icon: "🌉" },
    { value: "renovation", label: "Renovation", icon: "🔨" },
    { value: "other", label: "Other", icon: "📋" },
  ];

  const handleFileUpload = (event, fileType) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: [...prev[fileType], ...newFiles],
    }));
  };

  const removeFile = (fileType, fileId) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: prev[fileType].filter((file) => file.id !== fileId),
    }));
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add basic fields
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);

      // Add location fields
      formData.append("location[address]", data.location?.address || "");
      formData.append("location[city]", data.location?.city || "");
      formData.append("location[state]", data.location?.state || "");
      formData.append("location[zipCode]", data.location?.zipCode || "");

      // Add budget fields
      formData.append("budget[min]", data.budget?.min || "");
      formData.append("budget[max]", data.budget?.max || "");
      formData.append("budget[currency]", data.budget?.currency || "USD");

      // Add timeline fields
      formData.append("timeline[startDate]", data.timeline?.startDate || "");
      formData.append("timeline[endDate]", data.timeline?.endDate || "");
      formData.append("timeline[estimatedDuration]", data.timeline?.estimatedDuration || "");

      // Add specifications fields
      formData.append("specifications[area]", data.specifications?.area || "");
      formData.append("specifications[floors]", data.specifications?.floors || "1");
      formData.append("specifications[specialRequirements]", data.specifications?.specialRequirements || "");

      // Add bidding deadline
      formData.append("biddingDeadline", data.biddingDeadline || "");

      // Add files
      Object.keys(uploadedFiles).forEach((fileType) => {
        uploadedFiles[fileType].forEach((file) => {
          formData.append(fileType, file.file);
        });
      });

      await axios.post("http://localhost:5000/api/projects", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Project created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Project creation error:", error);
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map((err) => err.msg).join(", ");
        toast.error(errorMessages);
      } else {
        const message = error.response?.data?.message || "Failed to create project";
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-8">
          <Building2 className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                <input
                  type="text"
                  {...register("title", { required: "Project title is required" })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter project title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  {...register("category", { required: "Category is required" })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.category ? "border-red-300" : "border-gray-300"}`}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                {...register("description", { required: "Description is required" })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? "border-red-300" : "border-gray-300"}`}
                placeholder="Describe your project in detail..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  {...register("location.address", { required: "Address is required" })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors["location.address"] ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Street address"
                />
                {errors["location.address"] && <p className="mt-1 text-sm text-red-600">{errors["location.address"].message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  {...register("location.city", { required: "City is required" })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors["location.city"] ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="City"
                />
                {errors["location.city"] && <p className="mt-1 text-sm text-red-600">{errors["location.city"].message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  {...register("location.state", { required: "State is required" })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors["location.state"] ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="State"
                />
                {errors["location.state"] && <p className="mt-1 text-sm text-red-600">{errors["location.state"].message}</p>}
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Budget & Timeline
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget *</label>
                  <input
                    type="number"
                    {...register("budget.min", {
                      required: "Minimum budget is required",
                      min: { value: 0, message: "Budget must be positive" },
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors["budget.min"] ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {errors["budget.min"] && <p className="mt-1 text-sm text-red-600">{errors["budget.min"].message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget *</label>
                  <input
                    type="number"
                    {...register("budget.max", {
                      required: "Maximum budget is required",
                      min: { value: 0, message: "Budget must be positive" },
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors["budget.max"] ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0"
                  />
                  {errors["budget.max"] && <p className="mt-1 text-sm text-red-600">{errors["budget.max"].message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    {...register("timeline.startDate", { required: "Start date is required" })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors["timeline.startDate"] ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors["timeline.startDate"] && <p className="mt-1 text-sm text-red-600">{errors["timeline.startDate"].message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    {...register("timeline.endDate", { required: "End date is required" })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors["timeline.endDate"] ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors["timeline.endDate"] && <p className="mt-1 text-sm text-red-600">{errors["timeline.endDate"].message}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (days) *</label>
                <input
                  type="number"
                  {...register("timeline.estimatedDuration", {
                    required: "Duration is required",
                    min: { value: 1, message: "Duration must be at least 1 day" },
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors["timeline.estimatedDuration"] ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="30"
                />
                {errors["timeline.estimatedDuration"] && <p className="mt-1 text-sm text-red-600">{errors["timeline.estimatedDuration"].message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bidding Deadline *</label>
                <input
                  type="date"
                  {...register("biddingDeadline", { required: "Bidding deadline is required" })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.biddingDeadline ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.biddingDeadline && <p className="mt-1 text-sm text-red-600">{errors.biddingDeadline.message}</p>}
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area (sq ft) *</label>
                <input
                  type="number"
                  {...register("specifications.area", {
                    required: "Area is required",
                    min: { value: 1, message: "Area must be positive" },
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors["specifications.area"] ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="1000"
                />
                {errors["specifications.area"] && <p className="mt-1 text-sm text-red-600">{errors["specifications.area"].message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
                <input
                  type="number"
                  {...register("specifications.floors", {
                    min: { value: 1, message: "Floors must be at least 1" },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                  defaultValue="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
              <textarea
                {...register("specialRequirements")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requirements or notes..."
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Project Files
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Image className="w-4 h-4 mr-2" />
                  Property Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "propertyImages")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles.propertyImages.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.propertyImages.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button type="button" onClick={() => removeFile("propertyImages", file.id)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BOQ Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <File className="w-4 h-4 mr-2" />
                  BOQ Files
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => handleFileUpload(e, "boq")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles.boq.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.boq.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button type="button" onClick={() => removeFile("boq", file.id)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <File className="w-4 h-4 mr-2" />
                  Drawings
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.dxf"
                  onChange={(e) => handleFileUpload(e, "drawings")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles.drawings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.drawings.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button type="button" onClick={() => removeFile("drawings", file.id)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <File className="w-4 h-4 mr-2" />
                  Other Documents
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileUpload(e, "otherDocuments")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles.otherDocuments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.otherDocuments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button type="button" onClick={() => removeFile("otherDocuments", file.id)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button type="button" onClick={() => navigate("/dashboard")} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Project...
                </div>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectForm;
