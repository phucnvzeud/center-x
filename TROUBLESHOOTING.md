# Deployment Troubleshooting Guide

## Common Issues and Solutions

### Permission Errors with React Scripts

If you encounter the error: `react-scripts: Permission denied` during the build process, it's likely a permission issue with the executable files in the node_modules directory.

**Solution 1: Fix permissions manually**

The build script should automatically fix this, but if you need to do it manually:

```bash
cd frontend
chmod +x node_modules/.bin/react-scripts
chmod +x node_modules/react-scripts/bin/react-scripts.js
```

**Solution 2: Clean install**

If permission issues persist, try removing node_modules and reinstalling:

```bash
cd frontend
rm -rf node_modules
npm install
```

### Build Process Failures

If the build process fails with other errors:

1. Check the build logs for specific error messages
2. Ensure all dependencies are correctly installed
3. Verify that you're using a supported Node.js version (specified in package.json)

### Backend Connection Issues

If the frontend can't connect to the backend:

1. Check that environment variables are correctly set in the Render dashboard
2. Verify the MongoDB connection string is valid and the database is accessible
3. Check Render logs for any backend startup errors

### MongoDB Connection Issues

If you see MongoDB connection errors:

1. Verify your connection string is correct in the Render environment variables
2. Ensure your MongoDB Atlas cluster has network access allowed for all IPs (0.0.0.0/0)
3. Check if your MongoDB Atlas user has the correct permissions

## Render-Specific Troubleshooting

### Node.js Version Issues

If you encounter Node.js compatibility issues:

1. Check the current Node.js version being used by Render in the build logs
2. Update the `nodeVersion` field in render.yaml to a compatible version
3. Make sure your dependencies are compatible with the selected Node.js version

### Custom Domain Issues

If you've set up a custom domain but it's not working:

1. Verify DNS settings have propagated (can take up to 48 hours)
2. Check that SSL certificates are correctly provisioned in Render
3. Ensure the custom domain is correctly configured in the Render dashboard

### Billing or Resource Issues

If your app is crashing or performing poorly:

1. Check if you've hit free tier limits
2. Consider upgrading to a paid plan with more resources
3. Optimize your application for better performance

## Getting Help

If you continue to face issues:

1. Check [Render's Documentation](https://render.com/docs)
2. Post details of your issue in [Render's Community Forum](https://community.render.com/)
3. Contact Render support through your dashboard 