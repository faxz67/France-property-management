# ✅ Deployment Checklist

## 📦 Local Machine Preparation

### Frontend Configuration & Build
- [x] Updated `vite.config.ts` with server IP (192.168.1.109:4002)
- [x] Built frontend for production: `npm run build` in `project/frontend`
- [x] Verified `dist` folder exists with `index.html` and `assets`

### Backend Configuration
- [x] Created `env.production.template` with production settings
- [x] Prepared deployment scripts and documentation

### Files Ready to Transfer
- [x] `project/backend/` - Complete backend application
- [x] `project/frontend/dist/` - Built frontend application
- [x] `project/nginx.conf` - Nginx configuration
- [x] `project/deploy-to-server.sh` - Automated deployment script
- [x] `project/DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- [x] `project/QUICK_DEPLOY_REFERENCE.md` - Quick reference

---

## 🖥️ Server Preparation (192.168.1.109)

### System Requirements
- [ ] Ubuntu/Debian Linux installed
- [ ] Root or sudo access available
- [ ] SSH access configured
- [ ] Server IP confirmed: 192.168.1.109

### Software Installation
- [ ] Node.js v18+ installed
- [ ] NPM installed
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] MariaDB/MySQL installed and secured

### Network Configuration
- [ ] Port 22 (SSH) accessible
- [ ] Port 80 (HTTP) accessible
- [ ] Port 4002 (Backend) accessible (optional)
- [ ] Firewall configured (UFW)

---

## 📤 File Transfer

### Transfer Method Selected
- [ ] Option A: SCP/SFTP
- [ ] Option B: Git repository
- [ ] Option C: FileZilla/WinSCP

### Files Transferred
- [ ] Backend directory uploaded to `/var/www/property-management/backend/`
- [ ] Frontend dist uploaded to `/var/www/property-management/frontend/dist/`
- [ ] Nginx config uploaded to `/var/www/property-management/nginx.conf`
- [ ] Deploy script uploaded to `/var/www/property-management/deploy-to-server.sh`

---

## 💾 Database Configuration

### MariaDB Setup
- [ ] MariaDB secured with `mysql_secure_installation`
- [ ] Root password set
- [ ] Anonymous users removed
- [ ] Remote root login disabled

### Application Database
- [ ] Database created: `property_management`
- [ ] Database user created: `property_user`
- [ ] Permissions granted to user
- [ ] Connection tested successfully

---

## ⚙️ Backend Configuration

### Environment Configuration
- [ ] `.env` file created from template
- [ ] Database password updated in `.env`
- [ ] JWT_SECRET generated and set
- [ ] SESSION_SECRET generated and set
- [ ] Email credentials configured (if using)
- [ ] All URLs point to 192.168.1.109

### Backend Installation
- [ ] Dependencies installed: `npm install --production`
- [ ] Uploads directory created: `public/uploads`
- [ ] Directory permissions set: `chmod -R 755 public/uploads`
- [ ] Database synchronized: `node scripts/sync-database.js`

### PM2 Configuration
- [ ] Backend started with PM2: `pm2 start server.js --name property-backend`
- [ ] PM2 process list saved: `pm2 save`
- [ ] PM2 startup configured: `pm2 startup`
- [ ] Backend responding: `curl http://localhost:4002/api/auth/login`

---

## 🌐 Frontend Configuration

### Nginx Setup
- [ ] Nginx config copied to `/etc/nginx/sites-available/`
- [ ] Symbolic link created in `/etc/nginx/sites-enabled/`
- [ ] Default site disabled (optional)
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx restarted: `sudo systemctl restart nginx`
- [ ] Nginx enabled on boot: `sudo systemctl enable nginx`

---

## 🔒 Security Configuration

### Firewall
- [ ] UFW installed
- [ ] Port 22 allowed (SSH)
- [ ] Port 80 allowed (HTTP)
- [ ] Port 4002 allowed (Backend - optional)
- [ ] UFW enabled: `sudo ufw enable`
- [ ] Rules verified: `sudo ufw status`

### Application Security
- [ ] Strong database password set
- [ ] Secure JWT_SECRET generated
- [ ] Secure SESSION_SECRET generated
- [ ] File upload permissions configured
- [ ] CORS settings reviewed

---

## ✅ Verification & Testing

### Backend Verification
- [ ] PM2 shows backend as "online": `pm2 status`
- [ ] Backend responds to curl: `curl http://localhost:4002/api/auth/login`
- [ ] No errors in logs: `pm2 logs property-backend`
- [ ] Database connection successful

### Frontend Verification
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Frontend accessible: `curl http://localhost/`
- [ ] No errors in Nginx logs: `sudo tail /var/log/nginx/property-management-error.log`

### End-to-End Testing
- [ ] **Access from browser**: http://192.168.1.109
- [ ] **Login page loads** correctly
- [ ] **Can login** with valid credentials
- [ ] **Dashboard loads** without errors
- [ ] **Properties section** displays correctly
- [ ] **Images load** properly
- [ ] **Create new property** works
- [ ] **Edit property** works
- [ ] **Delete property** works (test with dummy data)
- [ ] **Tenants section** works
- [ ] **Bills section** works
- [ ] **Analytics** displays correctly
- [ ] **Logout** works correctly

### Network Testing
- [ ] **Accessible from other computers** on network (192.168.1.x)
- [ ] **Mobile devices** can access (on same network)
- [ ] **All API calls** work through Nginx proxy
- [ ] **File uploads** work correctly
- [ ] **File downloads** work correctly

---

## 📊 Monitoring Setup

### PM2 Monitoring
- [ ] PM2 monitoring dashboard accessible: `pm2 monit`
- [ ] Log rotation configured: `pm2 install pm2-logrotate`
- [ ] Log rotation settings configured

### System Monitoring
- [ ] Can view backend logs: `pm2 logs property-backend`
- [ ] Can view Nginx access logs
- [ ] Can view Nginx error logs
- [ ] Can view system resources: `htop` or `top`

---

## 🔄 Backup & Maintenance

### Database Backups
- [ ] Backup script created
- [ ] Backup script tested
- [ ] Cron job configured for automatic backups
- [ ] Backup storage location confirmed
- [ ] Old backup cleanup configured

### Application Backups
- [ ] Code backup strategy in place
- [ ] Upload files backup strategy in place
- [ ] Recovery procedure documented

---

## 📝 Documentation

### Created Documents
- [x] DEPLOYMENT_GUIDE.md - Comprehensive deployment guide
- [x] QUICK_DEPLOY_REFERENCE.md - Quick reference card
- [x] DEPLOYMENT_CHECKLIST.md - This checklist
- [x] deploy-to-server.sh - Automated deployment script
- [x] env.production.template - Production environment template

### Documentation Review
- [ ] Team members have access to documentation
- [ ] Credentials documented securely (not in git)
- [ ] Contact information for support
- [ ] Escalation procedures

---

## 🎉 Final Sign-Off

### Deployment Complete
- [ ] All checklist items completed
- [ ] Application accessible at http://192.168.1.109
- [ ] All features tested and working
- [ ] Monitoring in place
- [ ] Backups configured
- [ ] Documentation complete

### Post-Deployment
- [ ] Stakeholders notified of deployment
- [ ] User training completed (if needed)
- [ ] Support procedures in place
- [ ] Maintenance schedule established

---

## 📞 Important Information

**Server Details**
- IP Address: 192.168.1.109
- SSH Access: `ssh user@192.168.1.109`
- Application URL: http://192.168.1.109
- API URL: http://192.168.1.109:4002/api

**File Locations**
- Application: `/var/www/property-management/`
- Backend: `/var/www/property-management/backend/`
- Frontend: `/var/www/property-management/frontend/dist/`
- Uploads: `/var/www/property-management/backend/public/uploads/`
- Nginx Config: `/etc/nginx/sites-available/property-management`

**Key Commands**
```bash
# PM2
pm2 status
pm2 logs property-backend
pm2 restart property-backend
pm2 monit

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Database
mysql -u property_user -p property_management

# Logs
pm2 logs property-backend --lines 100
sudo tail -f /var/log/nginx/property-management-error.log
```

---

## 🚨 Rollback Plan

If deployment fails:

1. **Stop services**
   ```bash
   pm2 stop property-backend
   sudo systemctl stop nginx
   ```

2. **Review logs**
   ```bash
   pm2 logs property-backend --err
   sudo tail -100 /var/log/nginx/property-management-error.log
   ```

3. **Restore from backup** (if needed)
   ```bash
   mysql -u property_user -p property_management < backup.sql
   ```

4. **Contact support** with error logs

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Verified By**: _________________  
**Sign-Off Date**: _________________

