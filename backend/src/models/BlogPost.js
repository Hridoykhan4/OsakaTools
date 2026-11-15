import mongoose from "mongoose";

// Technical articles, published under /resources.
const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: "", maxlength: 600 },
    // Lightweight markdown: "## " headings, "- " bullets, blank-line paragraphs.
    content: { type: String, default: "", maxlength: 60000 },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    author: { type: String, default: "OSAKA TOOL Engineering Desk" },
    category: { type: String, default: "Guides", maxlength: 60 },
    tags: { type: [String], default: [] },
    relatedCategories: { type: [String], default: [] },
    readingMinutes: { type: Number, default: 5 },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

blogPostSchema.index({ title: "text", excerpt: "text", content: "text" });

export default mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);
