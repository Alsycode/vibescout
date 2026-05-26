// FILE: src/routes/admin/brokers.admin.routes.js
// PURPOSE: Admin CRUD routes for Brokers — create, update, toggle isActive, list leads by broker

import { Router } from 'express';
import Broker from '../../models/Broker.js';
import Lead from '../../models/Lead.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /admin/brokers — list all brokers
router.get('/', async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [docs, total] = await Promise.all([
      Broker.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-__v -bidHistory'),
      Broker.countDocuments(filter),
    ]);

    res.json({
      data: docs,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/brokers — create broker
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, company, assignedCities, tier } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const existing = await Broker.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'A broker with this email already exists' });
    }

    const broker = await Broker.create({
      name,
      email: email.toLowerCase(),
      phone,
      company,
      assignedCities: assignedCities ?? [],
      tier: tier ?? 'standard',
    });

    res.status(201).json({ data: broker });
  } catch (err) {
    next(err);
  }
});

// PUT /admin/brokers/:id — update broker
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, company, assignedCities, tier } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (company !== undefined) updates.company = company;
    if (assignedCities !== undefined) updates.assignedCities = assignedCities;
    if (tier !== undefined) updates.tier = tier;

    const broker = await Broker.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-__v -bidHistory');

    if (!broker) return res.status(404).json({ error: 'Broker not found' });

    res.json({ data: broker });
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/brokers/:id/status — toggle isActive
router.patch('/:id/status', async (req, res, next) => {
  try {
    const broker = await Broker.findById(req.params.id);
    if (!broker) return res.status(404).json({ error: 'Broker not found' });

    broker.isActive = !broker.isActive;
    await broker.save();

    res.json({ data: { _id: broker._id, isActive: broker.isActive } });
  } catch (err) {
    next(err);
  }
});

// GET /admin/brokers/:id/leads — leads assigned to broker
router.get('/:id/leads', async (req, res, next) => {
  try {
    const broker = await Broker.findById(req.params.id).select('_id name');
    if (!broker) return res.status(404).json({ error: 'Broker not found' });

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [docs, total] = await Promise.all([
      Lead.find({ assignedBrokerId: broker._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-__v -preferences -verdictObject -scoreBreakdown'),
      Lead.countDocuments({ assignedBrokerId: broker._id }),
    ]);

    res.json({
      broker: { _id: broker._id, name: broker.name },
      data: docs,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
