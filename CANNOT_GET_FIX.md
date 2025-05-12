# Fixing "Cannot GET /" Error on Render Deployment

If you're encountering the "Cannot GET /" error when accessing your deployed app at https://center-v1-1.onrender.com, follow these steps to troubleshoot and fix the issue.

## Understanding the Issue

The "Cannot GET /" error indicates that:
1. Your Express server is running
2. The route handler for the root path (/) is not working correctly
3. Either the frontend build files aren't being generated or aren't being served correctly

## Step 1: Check if NODE_ENV is Set to Production

The server is configured to serve static files only in production mode.

1. Visit https://center-v1-1.onrender.com/api/health
2. Check if `env` is set to `production` in the response
3. If not, update your environment variables in the Render dashboard

## Step 2: Check if Frontend Files Were Built

1. Visit https://center-v1-1.onrender.com/api/debug
2. Look for these properties in the response:
   - `frontend_dir_exists` should be `true`
   - `build_dir_exists` should be `true`
   - `index_exists` should be `true`

If any of these are `false`, the frontend build process is failing.

## Step 3: Rebuild Your App

1. Go to your Render dashboard
2. Find the "center-v1-1" web service
3. Click "Manual Deploy" > "Clear build cache & deploy"
4. Monitor the build logs for any errors

## Step 4: Update Your Code if Needed

If rebuilding doesn't fix the issue, deploy the changes we've made, which include:

1. An improved build-frontend.js script that explicitly builds the React app
2. Updated server.js with enhanced debugging and file serving
3. Updated package.json and render.yaml files

## Step 5: Check File Permissions

If the build completes but you still see "Cannot GET /", it might be a permissions issue:

1. Check the build logs for any permission errors
2. Make sure the React build process has execute permissions (our build script adds these)
3. Verify that the server has read permissions for the frontend/build directory

## Step 6: Verify MongoDB Connection

Sometimes backend issues can cause the frontend not to load:

1. Check your MongoDB connection string in the Render environment variables
2. Make sure your MongoDB Atlas database is accessible from Render
3. Check the logs for any database connection errors

## Step 7: Contact Render Support

If all else fails:

1. Gather your build logs and deployment details
2. Contact Render support with a detailed description of the issue
3. Share the steps you've already tried

## Additional Resources

- Check our [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more general deployment troubleshooting
- Visit the Render documentation: https://render.com/docs 