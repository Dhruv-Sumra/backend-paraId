// require('dotenv').config();
// or, if using ES modules:
import dotenv from 'dotenv';
dotenv.config(path);
console.log('DEBUG: MONGODB_URI from .env is:', process.env.MONGODB_URI);
process.env.MONGODB_URI = 'mongodb+srv://gujaratparasports:paraSports07@parasports.sc63qgr.mongodb.net/?retryWrites=true&w=majority&appName=ParaSports';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import playerRoutes from './routes/playerRoutes.js';
import idcardRoutes from './routes/idcardRoutes.js';    

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Enable gzip compression

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware with optimized limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// Serve static files with caching
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
app.use('/idcards', express.static(path.join(__dirname, 'idcards'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));

// Routes
app.use('/api/players', playerRoutes);
app.use('/api/idcards', idcardRoutes);

// Health check route with caching
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  res.json({ 
    message: 'Para Sports ID Card API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ 
    message: 'Para Sports ID Card Generator API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      players: '/api/players',
      idcards: '/api/idcards'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// MongoDB Connection with optimized settings for 1500+ users
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set in .env, using local MongoDB.');
    } else {
      console.log('🌐 Using MongoDB URI from .env:', process.env.MONGODB_URI);
    }
    
    // Optimized connection settings for high load
    await mongoose.connect(mongoURI, {
      maxPoolSize: 50, // Increased for 1500+ users
      minPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      bufferCommands: false,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'secondaryPreferred', // Read from secondary for better performance
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Start server with optimized settings
    if (!process.env.VERCEL) {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Optimized for 1500+ concurrent users`);
      });
      // Optimize server for high load
      server.maxConnections = 1000;
      server.keepAliveTimeout = 65000;
      server.headersTimeout = 66000;
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

connectDB();

export default app;

