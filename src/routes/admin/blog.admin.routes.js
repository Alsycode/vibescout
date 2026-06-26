import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import BlogPost from '../../models/BlogPost.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();

router.use(requireAuth, requireAdmin);

// POST /admin/blog/upload-image — upload cover image to Cloudinary
router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided.' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'vibescout-blog', resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed.' });
  }
});

// GET /admin/blog — list all posts (including unpublished)
router.get('/', async (req, res, next) => {
  try {
    const posts = await BlogPost.find()
      .sort({ date: -1 })
      .select('-content -__v');
    res.json({ posts, total: posts.length });
  } catch (err) {
    next(err);
  }
});

// GET /admin/blog/:id — single post (full content for editing)
router.get('/:id', async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).select('-__v');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

// POST /admin/blog — create post
router.post('/', async (req, res, next) => {
  try {
    const { slug, title, excerpt, content, category, tags, readTime, date, published, coverImage } = req.body;

    if (!slug || !title || !excerpt || !content || !category || !readTime || !date) {
      return res.status(400).json({ error: 'slug, title, excerpt, content, category, readTime, and date are required' });
    }

    const post = await BlogPost.create({
      slug, title, excerpt, content, category,
      tags: Array.isArray(tags) ? tags : [],
      readTime: Number(readTime),
      date,
      coverImage: coverImage ?? '',
      published: published !== false,
    });

    res.status(201).json({ post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A post with that slug already exists' });
    }
    next(err);
  }
});

// PUT /admin/blog/:id — update post
router.put('/:id', async (req, res, next) => {
  try {
    const { slug, title, excerpt, content, category, tags, readTime, date, published, coverImage } = req.body;

    const update = {};
    if (slug        !== undefined) update.slug        = slug;
    if (title       !== undefined) update.title       = title;
    if (excerpt     !== undefined) update.excerpt     = excerpt;
    if (content     !== undefined) update.content     = content;
    if (category    !== undefined) update.category    = category;
    if (tags        !== undefined) update.tags        = Array.isArray(tags) ? tags : [];
    if (readTime    !== undefined) update.readTime    = Number(readTime);
    if (date        !== undefined) update.date        = date;
    if (published   !== undefined) update.published   = published;
    if (coverImage  !== undefined) update.coverImage  = coverImage;

    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, select: '-__v' }
    );

    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A post with that slug already exists' });
    }
    next(err);
  }
});

// DELETE /admin/blog/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
