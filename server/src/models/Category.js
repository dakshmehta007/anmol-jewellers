import mongoose from "mongoose";

// One metal (Gold, Silver, Italian Silver...) with the jewellery types ("sections") inside it.
// `slug` is the web address part: /collection/<category slug>/<section slug>
const sectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 60 },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 60 },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    blurb: { type: String, trim: true, maxlength: 200, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    sections: [sectionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
