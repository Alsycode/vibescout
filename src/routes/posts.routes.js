import { Router } from 'express';
import BlogPost from '../models/BlogPost.js';

const router = Router();

// GET /posts — published posts sorted by date desc
router.get('/', async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ published: true })
      .sort({ date: -1 })
      .select('-content -__v');
    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

// GET /posts/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, published: true }).select('-__v');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

export default router;
