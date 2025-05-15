# Port Conflict Troubleshooting Guide

## Understanding Port Conflicts

When you see errors like `EADDRINUSE: address already in use` or `Something is already running on port X`, it means another process is already using the port your application is trying to use.

## Fixed Issues

1. **Backend Server Port Conflict (Port 5000)**
   - Error: `Error: listen EADDRINUSE: address already in use :::5000`
   - Solution: Changed the default port in `server.js` from 5000 to 5001

2. **Frontend Development Server Port Conflict (Port 3000)**
   - Error: `Something is already running on port 3000`
   - Solution: Created a `.env` file in the frontend directory to set PORT=3001

## How to Start Your Application

Now you can start your application with:

```
npm start
```

This will start:
- Backend server on port 5001
- Frontend development server on port 3001

## Common Causes of Port Conflicts

1. Another instance of your application is already running
2. Other development servers or applications using the same ports
3. System services that use these common ports

## How to Find and Kill Processes Using a Port

### Windows

1. Find the process using a specific port:
   ```
   netstat -ano | findstr :PORT_NUMBER
   ```

2. Kill the process by its PID (Process ID):
   ```
   taskkill /PID PID_NUMBER /F
   ```

### Alternative Solutions

1. **Change ports in configuration files** (as we did)
2. **Use environment variables** to specify different ports
3. **Kill conflicting processes** before starting your application

## Preventing Future Conflicts

1. Always check if your application is already running before starting it again
2. Consider using less common port numbers for development
3. Configure your application to automatically find available ports