import mongoose from "mongoose";

// A design a logged-in customer selected. Useful later for follow-ups, offers and enquiries.
const selectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    design: { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
    designName: { type: String, required: true, trim: true, maxlength: 120 },
    weight: { type: Number, required: true }, // grams
    source: { type: String, trim: true, maxlength: 80 }, // e.g. "Gold Ring"
  },
  { timestamps: true }
);
selectionSchema.index({ user: 1, createdAt: -1 });
selectionSchema.index({ createdAt: -1 });

export default mongoose.model("Selection", selectionSchema);
