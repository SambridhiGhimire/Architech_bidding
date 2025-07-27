// Utility functions for handling images across the application

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/**
 * Get the full URL for an uploaded file
 * @param {string} filePath - The file path from the backend
 * @returns {string} The complete URL to access the file
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return null;

  // If the path is absolute (contains drive letter or starts with /), extract just the relative part
  if (filePath.includes(":\\") || filePath.startsWith("/")) {
    // Extract the part after 'uploads' directory
    const uploadsIndex = filePath.indexOf("uploads");
    if (uploadsIndex !== -1) {
      filePath = filePath.substring(uploadsIndex);
    }
  }

  // Remove any leading slashes to avoid double slashes
  const cleanPath = filePath.replace(/^\/+/, "");
  return `${BACKEND_URL}/${cleanPath}`;
};

/**
 * Get the URL for a property image with fallback
 * @param {Object} file - The file object from the backend
 * @returns {string} The complete URL to access the image
 */
export const getPropertyImageUrl = (file) => {
  if (!file || !file.path) return null;
  return getFileUrl(file.path);
};

/**
 * Get the URL for a document file
 * @param {Object} file - The file object from the backend
 * @returns {string} The complete URL to access the file
 */
export const getDocumentUrl = (file) => {
  if (!file || !file.path) return null;
  return getFileUrl(file.path);
};

/**
 * Handle image load error by showing a fallback
 * @param {Event} e - The error event
 * @param {string} fallbackType - Type of fallback ('icon' or 'placeholder')
 */
export const handleImageError = (e, fallbackType = "icon") => {
  const img = e.target;
  const container = img.parentElement;

  // Hide the broken image
  img.style.display = "none";

  // Create or show fallback
  let fallback = container.querySelector(".image-fallback");
  if (!fallback) {
    fallback = document.createElement("div");
    fallback.className = "image-fallback w-full h-full bg-gray-200 flex items-center justify-center";

    if (fallbackType === "icon") {
      fallback.innerHTML = `
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      `;
    } else {
      fallback.innerHTML = `
        <div class="text-gray-400 text-sm text-center">
          <svg class="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Image not available
        </div>
      `;
    }

    container.appendChild(fallback);
  }

  fallback.style.display = "flex";
};

/**
 * Check if a file is an image
 * @param {Object} file - The file object
 * @returns {boolean} True if the file is an image
 */
export const isImageFile = (file) => {
  if (!file || !file.originalName) return false;

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const extension = file.originalName.toLowerCase().substring(file.originalName.lastIndexOf("."));

  return imageExtensions.includes(extension);
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} The file extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return "";
  return filename.toLowerCase().substring(filename.lastIndexOf(".") + 1);
};

/**
 * Get appropriate icon for file type
 * @param {string} filename - The filename
 * @returns {string} The icon class name
 */
export const getFileIcon = (filename) => {
  const extension = getFileExtension(filename);

  const iconMap = {
    pdf: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    docx: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    xls: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    xlsx: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    txt: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    dwg: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    dxf: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  };

  return iconMap[extension] || "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
