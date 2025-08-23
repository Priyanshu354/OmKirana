const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();


// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Multer Storage in Memory
const storage = multer.memoryStorage();

// Multer Upload Middleware
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|mp4|mov|avi|mkv/;
    const mimeType = allowedTypes.test(file.mimetype.toLowerCase());
    const extName = allowedTypes.test(file.originalname.split(".").pop().toLowerCase());

    if (mimeType && extName) cb(null, true);
    else cb(new Error("Only images and videos are allowed"));
  },
});

// Express Router
const router = express.Router();

router.post("/", upload.array("media", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const url = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "omkirana", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
      uploadedUrls.push(url);
    }

    res.status(200).json({
      message: "Upload successful",
      urls: uploadedUrls,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


module.exports = router;
