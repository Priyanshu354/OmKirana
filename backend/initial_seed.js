// seeds.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Resolve __dirname
//const __dirname = path.resolve();

// Paths
const productsFile = path.join(__dirname, "data", "products.json");
const imagesDir = path.join(__dirname, "images");

// Load products.json
let products = JSON.parse(fs.readFileSync(productsFile, "utf-8"));

// Convert name to slug for matching images
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// Upload image to Cloudinary
async function uploadImage(localPath) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: "products",
    });
    return result.secure_url;
  } catch (err) {
    console.error(`❌ Failed to upload ${localPath}:`, err.message);
    return null;
  }
}

async function seedProducts() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("🟢 Connected to MongoDB");

    for (let product of products) {
      const slug = slugify(product.name);

      // Find images that match the product slug
      const matchingImages = fs.readdirSync(imagesDir).filter((file) =>
        file.toLowerCase().startsWith(slug)
      );

      if (matchingImages.length === 0) {
        console.warn(`⚠️ No images found for ${product.name}, skipping image upload`);
      }

      // Upload images in parallel
      const uploadedUrls = await Promise.all(
        matchingImages.map((file) => uploadImage(path.join(imagesDir, file)))
      );

      // Assign uploaded URLs in the correct schema format
      product.image = { url: uploadedUrls.filter(Boolean) };

      // Save product to MongoDB
      await Product.create(product);

      console.log(`✅ Seeded: ${product.name} (${product.image.url.length} images)`);
    }

    // Update products.json with Cloudinary URLs
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    console.log("📄 Updated products.json with Cloudinary URLs");

    await mongoose.disconnect();
    console.log("🔴 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error seeding products:", err);
    await mongoose.disconnect();
  }
}

// Run seed script
seedProducts();
