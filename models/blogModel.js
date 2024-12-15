const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlogSchema = new Schema(
  {
    english: {
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      content: { type: String, required: true },
      excerpt: { type: String },
      metaDescription: { type: String },
      keywords: [{ type: String }],
    },
    hindi: {
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      content: { type: String, required: true },
      excerpt: { type: String },
      metaDescription: { type: String },
      keywords: [{ type: String }],
    },
    slug: { type: String, required: true, unique: true },
    thumbnail: { type: String, required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", BlogSchema);

module.exports = Blog;
