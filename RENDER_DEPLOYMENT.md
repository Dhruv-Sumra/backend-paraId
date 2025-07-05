# Render Deployment Guide

This guide explains how to deploy your Para Sports backend to Render.

## Prerequisites

1. Create a Render account at https://render.com
2. Push your code to a GitHub repository

## Deployment Steps

### 1. Create New Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Select this backend folder as the root directory

### 2. Configure Web Service

**Basic Settings:**
- **Name**: `para-sports-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Environment Variables

Add these environment variables in Render Dashboard:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Advanced Settings

- **Auto-Deploy**: Yes (recommended)
- **Health Check Path**: `/api/health`

## Important Notes

### File Storage
- Render has ephemeral storage - uploaded files will be deleted on service restarts
- For production, consider using external storage like AWS S3 or Cloudinary

### Environment Variables Setup

1. **MONGODB_URI**: Your MongoDB Atlas connection string
2. **JWT_SECRET**: A secure random string for JWT signing
3. **FRONTEND_URL**: Your frontend domain for CORS

### Database Connection
- The app is configured to work with MongoDB Atlas
- Ensure your MongoDB cluster allows connections from `0.0.0.0/0` or Render's IP ranges

## Testing Deployment

After deployment, test these endpoints:
- `GET https://your-app.onrender.com/api/health`
- `GET https://your-app.onrender.com/api/test`
- `GET https://your-app.onrender.com/`

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **503 Errors**: Usually database connection issues - check MONGODB_URI
3. **CORS Errors**: Ensure FRONTEND_URL is set correctly
4. **File Upload Issues**: Remember Render has ephemeral storage

### Logs:
- Check deployment logs in Render Dashboard
- Use `console.log` statements for debugging

## Performance Tips

1. Use free tier for testing, upgrade for production
2. Enable auto-deploy for CI/CD
3. Monitor resource usage in Render Dashboard
4. Consider using CDN for static assets

## Support

- Render Documentation: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/
