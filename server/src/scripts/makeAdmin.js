// Usage: node src/scripts/makeAdmin.js your@email.com   (sign up on the website first)
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv[2]?.toLowerCase().trim();
if (!email) {
  console.error("Usage: node src/scripts/makeAdmin.js your@email.com");
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);
const r = await User.updateOne({ email }, { role: "admin" });
console.log(
  r.matchedCount
    ? `${email} is now an admin. Refresh the website and open /admin.`
    : `No account found for ${email}. Sign up on the website first, then run this again.`
);
await mongoose.disconnect();
