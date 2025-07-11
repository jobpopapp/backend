const multer = require("multer");
const path = require("path");
const config = require("../config");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = "uploads/";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50); // Limit length
    cb(null, `certificate-${uniqueSuffix}-${baseName}${extension}`);
  },
});

// Enhanced file filter function
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Please upload PDF, JPG, JPEG, or PNG files only. Received: ${file.mimetype}`
      ),
      false
    );
  }
};

// Configure multer with enhanced options
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 2MB limit
    files: 1, // Only allow single file
  },
  fileFilter: fileFilter,
});

// Enhanced error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "File upload error";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = `File too large. Maximum size allowed is ${Math.round(
          config.upload.maxFileSize / (1024 * 1024)
        )}MB.`;
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Please upload only one certificate file.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message =
          "Unexpected file field. Please use 'certificate' as the file field name.";
        break;
      default:
        message = `Upload error: ${error.message}`;
    }

    return res.status(400).json({
      success: false,
      message: message,
      error: error.code,
    });
  } else if (error) {
    // Handle custom file filter errors
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
};

module.exports = {
  upload,
  handleUploadError,
};
