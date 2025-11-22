# 🚀 Production Deployment Guide - Nginx + PM2 + Node.js

## Complete Setup for Property Management System

---

## 🎯 Overview

**Current Issue:** API calls from frontend failing with 301 redirects or "Cannot GET /api" errors

**Root Causes Identified:**
1. ❌ Backend listening on `localhost` only (not accessible to Nginx)
2. ❌ No proper 404 handler for undefined `/api/*` routes
3. ❌ CORS not configured for production domain
4. ❌ Nginx proxy configuration missing or incorrect

**Solution:** Complete fix for Express backend routing + production-ready Nginx configuration

---

## ✅ What Was Fixed

### 1. Backend Express Server (`backend/server.js`)

#### A. Added Proper API Route Handlers
```javascript
// NEW: Root API endpoint that returns available endpoints
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Property Management API',
    version: '1.0.0',
    endpoints: { /* ... */ }
  });
});

// NEW: 404 handler for undefined API routes (MUST come AFTER all API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});
```

#### B. Production Binding
```javascript
// Bind to 0.0.0.0 in production (allows Nginx to connect)
const bindAddress = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const server = app.listen(Number(PORT), bindAddress, () => {
  // ...
});
```

#### C. Enhanced CORS for Production
```javascript
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:4002',
  'http://localhost:80',
  'http://localhost'
];

// Add production domain from environment variable
if (process.env.PRODUCTION_DOMAIN) {
  allowedOrigins.push(`http://${process.env.PRODUCTION_DOMAIN}`);
  allowedOrigins.push(`https://${process.env.PRODUCTION_DOMAIN}`);
}
```

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Update Backend Environment Variables

Edit `/var/www/property-management/backend/.env`:

```bash
# Server Configuration
PORT=4002
NODE_ENV=production
FRONTEND_URL=http://your-domain.com

# Production Domain (for CORS)
PRODUCTION_DOMAIN=your-domain.com

# Backend Origin
BACKEND_ORIGIN=http://your-domain.com
```

**Important:** Replace `your-domain.com` with your actual domain

---

### Step 2: Deploy Nginx Configuration

#### A. Copy the nginx.conf file to the server:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/property-management
```

#### B. Update domain in config:
```bash
sudo nano /etc/nginx/sites-available/property-management
# Change: server_name your-domain.com www.your-domain.com;
# To:     server_name youractual-domain.com www.youractual-domain.com;
```

#### C. Create symbolic link:
```bash
sudo ln -s /etc/nginx/sites-available/property-management /etc/nginx/sites-enabled/
```

#### D. Remove default config (if exists):
```bash
sudo rm /etc/nginx/sites-enabled/default
```

#### E. Test and reload:
```bash
# Test configuration
sudo nginx -t

# If test passes:
sudo systemctl reload nginx
```

---

### Step 3: Start Backend with PM2

#### A. Navigate to backend directory:
```bash
cd /var/www/property-management/backend
```

#### B. Install dependencies (if not done):
```bash
npm install --production
```

#### C. Start with PM2:
```bash
# Stop existing instance (if running)
pm2 stop property-backend

# Delete old instance
pm2 delete property-backend

# Start with production environment
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### D. Verify backend is running:
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs property-backend --lines 50

# Test direct connection
curl http://localhost:4002/api
# Should return: {"success":true,"message":"Property Management API",...}
```

---

### Step 4: Deploy Frontend

#### A. Build frontend locally (on your dev machine):
```bash
cd frontend
npm run build
```

#### B. Upload dist folder to server:
```bash
# Using SCP
scp -r dist/* user@your-server:/var/www/property-management/frontend/dist/

# Or using rsync
rsync -avz --delete dist/ user@your-server:/var/www/property-management/frontend/dist/
```

#### C. Set correct permissions:
```bash
sudo chown -R www-data:www-data /var/www/property-management/frontend/dist
sudo chmod -R 755 /var/www/property-management/frontend/dist
```

---

### Step 5: Verify Everything Works

#### A. Test API directly:
```bash
# From server
curl http://localhost:4002/api
curl http://localhost:4002/health

# From outside (through Nginx)
curl http://your-domain.com/api
curl http://your-domain.com/health
```

#### B. Test frontend:
```bash
curl http://your-domain.com/
# Should return HTML content
```

#### C. Check logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/property-management-error.log
sudo tail -f /var/log/nginx/property-management-access.log

# Backend logs
pm2 logs property-backend
```

---

## 🔧 Troubleshooting Guide

### Issue 1: "502 Bad Gateway"

**Cause:** Backend not running or not accessible

**Fix:**
```bash
# Check if backend is running
pm2 status

# Check if port 4002 is listening
sudo netstat -tulpn | grep 4002

# Restart backend
pm2 restart property-backend

# Check backend logs
pm2 logs property-backend --lines 100
```

---

### Issue 2: "Cannot GET /api" or 404

**Cause:** Nginx not proxying correctly

**Fix:**
```bash
# Test Nginx config
sudo nginx -t

# Check if location /api/ exists in config
sudo grep -A 10 "location /api/" /etc/nginx/sites-enabled/property-management

# Reload Nginx
sudo systemctl reload nginx

# Test direct backend connection
curl http://localhost:4002/api
```

---

### Issue 3: CORS Errors in Browser

**Cause:** Production domain not in CORS whitelist

**Fix:**
1. Add `PRODUCTION_DOMAIN` to `.env`:
   ```bash
   PRODUCTION_DOMAIN=your-domain.com
   ```

2. Restart backend:
   ```bash
   pm2 restart property-backend
   ```

3. Clear browser cache and test

---

### Issue 4: 301 Redirects

**Cause:** Trailing slash issues in Nginx proxy_pass

**Fix:**
Ensure Nginx config has:
```nginx
location /api/ {
    proxy_pass http://backend_api;  # NO trailing slash after backend_api
}
```

---

### Issue 5: File Uploads Not Working

**Cause:** Upload directory permissions or Nginx max upload size

**Fix:**
```bash
# Check upload directory exists
ls -la /var/www/property-management/backend/uploads

# Set correct permissions
sudo chown -R www-data:www-data /var/www/property-management/backend/uploads
sudo chmod -R 755 /var/www/property-management/backend/uploads

# Verify Nginx config has:
# client_max_body_size 10M;
```

---

## 🎯 Critical Configuration Points

### ✅ Backend Must:
1. Listen on `0.0.0.0:4002` in production (not `localhost:4002`)
2. Have all routes under `/api` prefix
3. Have 404 handler for undefined API routes
4. Include production domain in CORS whitelist
5. Return JSON for all API endpoints

### ✅ Nginx Must:
1. Proxy `/api/` to `http://127.0.0.1:4002` (internal communication)
2. Use `proxy_pass http://backend_api;` WITHOUT trailing slash
3. Set all required proxy headers (X-Real-IP, X-Forwarded-For, etc.)
4. Serve frontend static files from `/var/www/property-management/frontend/dist`
5. Handle SPA routing with `try_files $uri $uri/ /index.html;`

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] `curl http://localhost:4002/api` returns JSON
- [ ] `curl http://your-domain.com/api` returns same JSON
- [ ] `pm2 status` shows backend running
- [ ] `sudo nginx -t` passes validation
- [ ] Browser can load frontend at `http://your-domain.com`
- [ ] API calls from frontend work (check browser Network tab)
- [ ] No CORS errors in browser console
- [ ] File uploads work (property photos, tenant documents)
- [ ] PDF downloads work (bills)

---

## 🔐 Security Checklist (Optional but Recommended)

### Enable SSL with Let's Encrypt:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

After SSL setup:
- Update `.env`: `FRONTEND_URL=https://your-domain.com`
- Update `.env`: `BACKEND_ORIGIN=https://your-domain.com`
- Restart backend: `pm2 restart property-backend`

---

## 📞 Quick Commands Reference

```bash
# Backend Management
pm2 restart property-backend    # Restart backend
pm2 logs property-backend        # View logs
pm2 status                       # Check status
pm2 monit                        # Monitor resources

# Nginx Management
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload config
sudo systemctl status nginx      # Check status
sudo tail -f /var/log/nginx/property-management-error.log  # View logs

# Database
mysql -u root -p property_rental  # Connect to database
pm2 restart property-backend      # Restart after DB changes
```

---

## 🎉 You're Done!

Your Property Management System should now be:
- ✅ Accessible at `http://your-domain.com`
- ✅ API working at `http://your-domain.com/api`
- ✅ All routes properly configured
- ✅ CORS working correctly
- ✅ Production-ready and secure

If you encounter any issues, refer to the Troubleshooting Guide above or check the logs.
