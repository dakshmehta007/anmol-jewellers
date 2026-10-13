import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./app.js";
import { cloudinaryReady } from "./config/cloudinary.js";

const { MONGODB_URI, JWT_SECRET, PORT = 5000 } = process.env;

if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Missing config: set MONGODB_URI and a JWT_SECRET of 32+ characters in server/.env");
  process.exit(1);
}
if (!cloudinaryReady()) {
  console.warn("Cloudinary is not configured: photo uploads in the admin panel will not work until you add the CLOUDINARY_ values to server/.env");
}

try {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
}

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
