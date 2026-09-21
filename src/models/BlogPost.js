import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema(
  {
    slug:      { type: String, required: true, unique: true, trim: true },
    title:     { type: String, required: true, trim: true },
    excerpt:   { type: String, required: true, trim: true },
    content:   { type: String, required: true },
    category:  { type: String, required: true, trim: true },
    tags:      { type: [String], default: [] },
    readTime:  { type: Number, required: true, min: 1 },
    date:      { type: String, required: true }, // ISO date string YYYY-MM-DD
    coverImage: { type: String, default: '' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// PERF-5 — slug's field-level `unique: true` above already creates an index
// on slug; a second, non-unique .index({slug:1}) call was a redundant
// duplicate (Mongoose warned on every boot — removed, not added, here).
BlogPostSchema.index({ published: 1, date: -1 });

export default mongoose.model('BlogPost', BlogPostSchema);
