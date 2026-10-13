import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

// One jewellery design. `category` and `section` hold the slugs from the Category collection.
// images[0] is the cover photo.
const designSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    section: { type: String, required: true, trim: true, maxlength: 60 },
    weightMin: { type: Number, required: true, min: 0 },
    weightMax: { type: Number, required: true, min: 0 },
    weightStep: { type: Number, default: 1, min: 0 },
    images: { type: [imageSchema], default: [] },
    featured: { type: Boolean, default: false }, // shown in "Popular designs" on the home page
    active: { type: Boolean, default: true }, // false = hidden from customers
  },
  { timestamps: true }
);

designSchema.index({ active: 1, category: 1, section: 1, createdAt: -1 });
designSchema.index({ active: 1, featured: 1, createdAt: -1 });

designSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export default mongoose.model("Design", designSchema);
