const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories based on file type
    let uploadPath = uploadsDir;
    let relativePath = "uploads";

    if (file.fieldname === "propertyImages") {
      uploadPath = path.join(uploadsDir, "property-images");
      relativePath = "uploads/property-images";
    } else if (file.fieldname === "boq") {
      uploadPath = path.join(uploadsDir, "boq");
      relativePath = "uploads/boq";
    } else if (file.fieldname === "drawings") {
      uploadPath = path.join(uploadsDir, "drawings");
      relativePath = "uploads/drawings";
    } else if (file.fieldname === "otherDocuments") {
      uploadPath = path.join(uploadsDir, "documents");
      relativePath = "uploads/documents";
    } else if (file.fieldname === "bidDocuments") {
      uploadPath = path.join(uploadsDir, "bid-documents");
      relativePath = "uploads/bid-documents";
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Store relative path for later use
    file.relativePath = relativePath;

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + "-" + uniqueSuffix + ext;

    // Store the relative path in the file object
    file.relativePath = file.relativePath || "uploads";
    file.relativeFilePath = path.join(file.relativePath, filename).replace(/\\/g, "/");

    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];
  const allowedDrawingTypes = ["application/pdf", "image/dwg", "application/acad", "application/dxf", "application/dwg"];

  let allowedTypes = [];

  // Set allowed types based on field name
  if (file.fieldname === "propertyImages") {
    allowedTypes = allowedImageTypes;
  } else if (file.fieldname === "boq" || file.fieldname === "otherDocuments" || file.fieldname === "bidDocuments") {
    allowedTypes = allowedDocumentTypes;
  } else if (file.fieldname === "drawings") {
    allowedTypes = allowedDrawingTypes;
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files per request
  },
});

// Specific upload configurations
const uploadProjectFiles = upload.fields([
  { name: "propertyImages", maxCount: 10 },
  { name: "boq", maxCount: 5 },
  { name: "drawings", maxCount: 10 },
  { name: "otherDocuments", maxCount: 5 },
]);

const uploadBidDocuments = upload.fields([{ name: "bidDocuments", maxCount: 5 }]);

const uploadSingleFile = upload.single("file");

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many files. Maximum is 10 files." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected file field." });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
};

module.exports = {
  uploadProjectFiles,
  uploadBidDocuments,
  uploadSingleFile,
  handleUploadError,
};
