# 🔧 API Proxy Fix - Summary of Changes

## Problem Identified
- Backend was listening on `localhost` only → Nginx couldn't connect
- No 404 handler for undefined `/api/*` routes → Generic errors
- CORS not configured for production domain → Browser blocked requests
- Missing Nginx configuration for production

---

## ✅ Changes Made

### 1. Backend: `backend/server.js`

#### Added Root API Endpoint
```javascript
// NEW: Returns available API endpoints
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Property Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admins: '/api/admins',
      properties: '/api/properties',
      tenants: '/api/tenants',
      bills: '/api/bills',
      analytics: '/api/analytics',
      expenses: '/api/expenses',
      restore: '/api/restore',
      audit: '/api/audit'
    }
  });
});
```

#### Added 404 Handler for Undefined API Routes
```javascript
// NEW: Must come AFTER all API route definitions
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});
```

#### Fixed Server Binding for Production
```javascript
// OLD:
const server = app.listen(Number(PORT), 'localhost', () => {

// NEW: Bind to 0.0.0.0 in production (allows Nginx proxy)
const bindAddress = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const server = app.listen(Number(PORT), bindAddress, () => {
```

#### Enhanced CORS Configuration
```javascript
// OLD:
app.use(cors({
  origin: [
    'http://localhost:5174',
    'http://localhost:4002'
  ],
  // ...
}));

// NEW: Dynamic CORS with production domain support
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5174',
  'http://localhost:5174',
  'http://localhost:4002',
  'http://localhost:80',
  'http://localhost'
];

if (process.env.PRODUCTION_DOMAIN) {
  allowedOrigins.push(`http://${process.env.PRODUCTION_DOMAIN}`);
  allowedOrigins.push(`https://${process.env.PRODUCTION_DOMAIN}`);
  allowedOrigins.push(`http://www.${process.env.PRODUCTION_DOMAIN}`);
  allowedOrigins.push(`https://www.${process.env.PRODUCTION_DOMAIN}`);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Cache-Control']
}));
```

---

### 2. New File: `nginx.conf`

Complete production-ready Nginx configuration with:
- API proxy to backend on port 4002
- Static file serving for frontend
- Upload file serving with caching
- Security headers
- CORS handling
- SSL configuration template (commented)
- SPA routing support

**Key Configuration:**
```nginx
location /api/ {
    proxy_pass http://backend_api;  # NO trailing slash!
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # ... more headers
}
```

---

### 3. New File: `DEPLOYMENT.md`

Complete production deployment guide with:
- Step-by-step instructions
- Troubleshooting guide
- Configuration checklist
- Common issues and solutions
- SSL setup instructions
- Quick command reference

---

## 🎯 Required Environment Variables

Add to `backend/.env` for production:

```bash
# Add this line:
PRODUCTION_DOMAIN=your-domain.com
```

---

## 📋 Deployment Steps (Quick Version)

1. **Update .env:**
   ```bash
   echo "PRODUCTION_DOMAIN=your-domain.com" >> backend/.env
   ```

2. **Deploy Nginx config:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/property-management
   sudo ln -s /etc/nginx/sites-available/property-management /etc/nginx/sites-enabled/
   sudo nano /etc/nginx/sites-available/property-management  # Update domain
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **Restart backend:**
   ```bash
   cd backend
   pm2 restart property-backend
   pm2 logs property-backend
   ```

4. **Verify:**
   ```bash
   curl http://localhost:4002/api  # Direct backend
   curl http://your-domain.com/api  # Through Nginx
   ```

---

## 🧪 Testing

### Test Direct Backend:
```bash
curl http://localhost:4002/api
# Expected: {"success":true,"message":"Property Management API",...}

curl http://localhost:4002/api/nonexistent
# Expected: {"success":false,"error":"API endpoint not found",...}
```

### Test Through Nginx:
```bash
curl http://your-domain.com/api
# Expected: Same as direct backend test

curl http://your-domain.com/api/nonexistent
# Expected: {"success":false,"error":"API endpoint not found",...}
```

### Test Frontend:
```bash
curl http://your-domain.com/
# Expected: HTML content (index.html)
```

---

## ⚠️ Important Notes

1. **Route Order Matters:**
   - All API routes MUST be defined BEFORE the `/api/*` 404 handler
   - The 404 handler acts as a catch-all for undefined routes

2. **Nginx proxy_pass:**
   - NO trailing slash after `backend_api` in `proxy_pass` directive
   - Trailing slash would strip the `/api` prefix from requests

3. **Production Binding:**
   - Backend must bind to `0.0.0.0` in production for Nginx to connect
   - `localhost` binding only works for same-machine connections

4. **CORS:**
   - Production domain must be in allowedOrigins
   - Set via `PRODUCTION_DOMAIN` environment variable

---

## 🐛 Common Issues Fixed

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Backend on `localhost` only | Bind to `0.0.0.0` in production |
| Cannot GET /api | No 404 handler | Added `/api/*` catch-all route |
| CORS errors | Domain not whitelisted | Added `PRODUCTION_DOMAIN` to CORS |
| 301 Redirects | Nginx config issues | Proper `proxy_pass` configuration |
| Undefined routes | No proper error handling | Added specific 404 JSON response |

---

## 📚 Files Changed

- ✅ `backend/server.js` - Enhanced routing and CORS
- ✅ `nginx.conf` - NEW production Nginx config
- ✅ `DEPLOYMENT.md` - NEW complete deployment guide
- ✅ `CHANGES.md` - This file

---

## 🚀 Next Steps

1. Review the changes in `backend/server.js`
2. Configure Nginx using `nginx.conf` template
3. Follow `DEPLOYMENT.md` for complete setup
4. Test thoroughly using the provided commands
5. Enable SSL for production (see DEPLOYMENT.md)

---

**All changes are backward compatible with development environment!**

Development mode (NODE_ENV != 'production'):
- Still binds to `localhost`
- CORS allows all localhost origins
- Works exactly as before
