# Deployment Guide for Language Center App on Render

This guide provides step-by-step instructions for deploying the Language Center Management System on Render.

## Prerequisites

- A Render account (https://render.com)
- A MongoDB Atlas database (or any MongoDB service)

## Deployment Steps

### 1. Create MongoDB Atlas Cluster

1. Sign up or log in to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up a database user with appropriate permissions
4. Get your MongoDB connection string
5. Make sure to whitelist all IP addresses (0.0.0.0/0) in the network access settings

### 2. Deploy to Render

#### Option 1: Manual Deployment

1. Log in to your Render account
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure your service with the following settings:
   - **Name**: language-center (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the closest to your users
   - **Branch**: main (or your default branch)
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Plan**: Select an appropriate plan (Free tier works for testing)
   - **Advanced Settings**: Click and add these environment variables:
     - `NODE_ENV`: `production`
     - `MONGO_URI`: Your MongoDB connection string

5. Click **Create Web Service**

#### Option 2: Using the render.yaml File

1. Fork this repository to your GitHub account
2. Log in to Render
3. Go to Dashboard → **New** → **Blueprint**
4. Connect your GitHub account and select your forked repository
5. Render will detect the `render.yaml` file and provide configuration options
6. Add the required environment variables when prompted (at least `MONGO_URI`)
7. Click **Apply** to create the service

### 3. Monitor Deployment

1. Render will automatically build and deploy your application
2. You can monitor the build and deployment logs in the Render dashboard
3. Once deployment is complete, you can access your app at the provided URL

## Environment Variables

Make sure to set these environment variables in your Render service:

- `NODE_ENV`: Set to `production`
- `MONGO_URI`: Your MongoDB connection string
- `PORT`: Render sets this automatically, but you can override it if needed

## Troubleshooting

If you encounter issues during deployment, please refer to the detailed [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide included in this repository.

Common issues addressed in the troubleshooting guide include:
- Permission errors with React Scripts
- Build process failures
- Backend connection issues
- MongoDB connection problems
- Node.js version compatibility

## Permission Issues with React Scripts

The deployment is configured to automatically fix permission issues with React Scripts. If you still encounter a "Permission denied" error for react-scripts, see the troubleshooting guide for manual solutions.

## Updating Your Deployment

Any new commits pushed to your connected repository branch will trigger a new build and deployment on Render automatically.

## Scaling (Optional)

Render allows you to scale your service as needed:

1. Go to your service in the Render dashboard
2. Click on **Settings**
3. Under **Instance Type**, select a larger plan if needed

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/) 