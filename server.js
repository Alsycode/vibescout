// FILE: server.js
// PURPOSE: Express app init, middleware, routes, MongoDB connection, cron import

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { errorHandler } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';

import authRoutes from './src/routes/auth.routes.js';
import analyzeRoutes from './src/routes/analyze.routes.js';
import funnelRoutes from './src/routes/funnel.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import shadowPropertiesAdminRoutes from './src/routes/admin/shadowProperties.admin.routes.js';
import leadsAdminRoutes from './src/routes/admin/leads.admin.routes.js';
import brokersAdminRoutes from './src/routes/admin/brokers.admin.routes.js';
import clustersAdminRoutes from './src/routes/admin/clusters.admin.routes.js';

import './src/jobs/cronJobs.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiLimiter);

app.use('/auth', authRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/funnel', funnelRoutes);
app.use('/report', reportRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin/shadow-properties', shadowPropertiesAdminRoutes);
app.use('/admin/leads', leadsAdminRoutes);
app.use('/admin/brokers', brokersAdminRoutes);
app.use('/admin/clusters', clustersAdminRoutes);

app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('[MongoDB] Connected');
    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });

export default app;
