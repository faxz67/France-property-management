# 🚀 Production Deployment Guide
## Server: 192.168.1.109

---

## ✅ Pre-Deployment Checklist (LOCAL MACHINE)

- [x] Frontend configuration updated (vite.config.ts)
- [x] Frontend built for production (dist folder created)
- [x] Production environment template created
- [ ] Files ready to transfer to server

---

## 📦 Phase 1: Prepare Files for Transfer

### 1.1 - Verify Build Output

Check that the frontend dist folder exists:

```powershell
# On Windows (current machine)
dir project\frontend\dist
```

You should see `index.html` and `assets` folder.

### 1.2 - Create Archive for Transfer

**Option A: ZIP the entire project**
```powershell
# Create a zip file
Compress-Archive -Path "project\*" -DestinationPath "property-management-deploy.zip"
```

**Option B: Use Git (Recommended)**
```bash
# Initialize git if not already done
cd project
git init
git add .
git commit -m "Production ready"
# Push to your Git repository
```

---

## 🖥️ Phase 2: Server Setup (ON SERVER 192.168.1.109)

### 2.1 - Connect to Server

```bash
ssh user@192.168.1.109
```

### 2.2 - Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.0.0 or higher
npm --version

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install MariaDB (if not installed)
sudo apt install mariadb-server -y
```

### 2.3 - Create Application Directory

```bash
sudo mkdir -p /var/www/property-management
sudo chown -R $USER:$USER /var/www/property-management
cd /var/www/property-management
```

### 2.4 - Transfer Files to Server

**Option A: Using SCP (from Windows)**
```powershell
# From your Windows machine
scp -r "C:\Users\faisa\Downloads\Rahim Anna France Project Home Sharing\project\backend" user@192.168.1.109:/var/www/property-management/
scp -r "C:\Users\faisa\Downloads\Rahim Anna France Project Home Sharing\project\frontend\dist" user@192.168.1.109:/var/www/property-management/frontend/
scp "C:\Users\faisa\Downloads\Rahim Anna France Project Home Sharing\project\nginx.conf" user@192.168.1.109:/var/www/property-management/
```

**Option B: Using WinSCP or FileZilla**
- Use a GUI tool to transfer the folders

**Option C: Using Git (Recommended)**
```bash
# On server
cd /var/www/property-management
git clone <your-repo-url> .
```

---

## 💾 Phase 3: Database Configuration

### 3.1 - Secure MariaDB

```bash
sudo mysql_secure_installation
```

Follow prompts:
- Set root password: YES
- Remove anonymous users: YES
- Disallow root login remotely: YES
- Remove test database: YES
- Reload privilege tables: YES

### 3.2 - Create Database and User

```bash
sudo mysql -u root -p
```

In the MySQL console:

```sql
-- Create database
CREATE DATABASE property_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with strong password
CREATE USER 'property_user'@'localhost' IDENTIFIED BY 'your_very_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON property_management.* TO 'property_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT User, Host FROM mysql.user;

-- Exit
EXIT;
```

---

## ⚙️ Phase 4: Backend Configuration

### 4.1 - Setup Environment File

```bash
cd /var/www/property-management/backend

# Copy template to .env
cp env.production.template .env

# Edit the file
nano .env
```

**IMPORTANT: Update these values in .env:**

```env
# Database credentials (from Phase 3.2)
DB_PASSWORD=your_very_secure_password_here

# Generate JWT Secret
JWT_SECRET=<paste generated key here>

# Generate Session Secret
SESSION_SECRET=<paste generated key here>
```

**To generate secure keys:**

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy each generated key into your `.env` file.

### 4.2 - Install Dependencies

```bash
cd /var/www/property-management/backend

# Install production dependencies
npm install --production

# Create uploads directory with proper permissions
mkdir -p public/uploads
chmod -R 755 public/uploads
```

### 4.3 - Initialize Database

```bash
# Run database synchronization
node scripts/sync-database.js
```

You should see: "Database synchronized successfully"

### 4.4 - Test Backend Manually (Optional)

```bash
# Test run
npm start
```

If it starts successfully (you see "Server running on port 4002"), press `Ctrl+C` to stop it.

### 4.5 - Start Backend with PM2

```bash
# Start the backend
pm2 start server.js --name property-backend

# View status
pm2 status

# View logs
pm2 logs property-backend --lines 50

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command that PM2 shows you (usually starts with sudo)
```

### 4.6 - Verify Backend is Running

```bash
# Test the backend
curl http://localhost:4002/api/auth/login

# You should see: {"error":"Invalid credentials"} or similar
# This confirms the server is responding
```

---

## 🌐 Phase 5: Nginx Configuration

### 5.1 - Configure Nginx

```bash
# Copy nginx configuration
sudo cp /var/www/property-management/nginx.conf /etc/nginx/sites-available/property-management

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/property-management /etc/nginx/sites-enabled/

# Remove default site (optional but recommended)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

You should see: "syntax is ok" and "test is successful"

### 5.2 - Start Nginx

```bash
# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## 🔥 Phase 6: Firewall Configuration

```bash
# Check if UFW is active
sudo ufw status

# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Nginx)
sudo ufw allow 4002/tcp  # Backend (optional, for direct access)

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status numbered
```

---

## ✅ Phase 7: Verification & Testing

### 7.1 - Test from Server

```bash
# Test backend directly
curl http://localhost:4002/api/auth/login

# Test frontend through Nginx
curl http://localhost/

# You should see HTML content
```

### 7.2 - Test from Your Computer

1. **Open Browser** on your Windows machine

2. **Navigate to** `http://192.168.1.109`

3. **You should see** the login page

4. **Test login** with existing credentials (or create first admin)

### 7.3 - Check Logs if Issues Occur

```bash
# PM2 logs (backend)
pm2 logs property-backend --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/property-management-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/property-management-error.log

# System logs
sudo journalctl -u nginx -f
```

---

## 📊 Phase 8: Monitoring & Maintenance

### 8.1 - Setup PM2 Monitoring

```bash
# View real-time monitoring
pm2 monit

# View process list
pm2 list

# Restart backend if needed
pm2 restart property-backend

# Stop backend
pm2 stop property-backend

# View detailed info
pm2 show property-backend
```

### 8.2 - Setup Log Rotation

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M    # Rotate when 10MB
pm2 set pm2-logrotate:retain 7         # Keep 7 rotated logs
pm2 set pm2-logrotate:compress true    # Compress old logs
```

### 8.3 - Database Backup Script

Create a backup script:

```bash
nano /var/www/property-management/backup-db.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/var/www/property-management/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u property_user -p'your_password' property_management > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

Make it executable:

```bash
chmod +x /var/www/property-management/backup-db.sh
```

Setup daily backup cron:

```bash
crontab -e
# Add this line (runs daily at 2 AM):
0 2 * * * /var/www/property-management/backup-db.sh
```

---

## 🔧 Troubleshooting Guide

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs property-backend --err

# Try manual start to see errors
cd /var/www/property-management/backend
npm start

# Check if port is already in use
sudo netstat -tulpn | grep :4002

# Check environment file
cat .env | grep -v PASSWORD | grep -v SECRET
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs property-backend

# Restart backend
pm2 restart property-backend

# Check Nginx error logs
sudo tail -f /var/log/nginx/property-management-error.log
```

### Database Connection Errors

```bash
# Test database connection
mysql -u property_user -p property_management

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check user privileges
mysql -u root -p -e "SHOW GRANTS FOR 'property_user'@'localhost';"
```

### Port Already in Use

```bash
# Find process using port 4002
sudo netstat -tulpn | grep :4002

# Kill the process (replace PID)
sudo kill -9 <PID>

# Or use PM2 to stop
pm2 stop all
pm2 start property-backend
```

### Images Not Loading

```bash
# Check uploads directory exists
ls -la /var/www/property-management/backend/public/uploads

# Fix permissions
chmod -R 755 /var/www/property-management/backend/public/uploads

# Check Nginx uploads location
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Cannot Access from Other Computers

```bash
# Check firewall rules
sudo ufw status

# Allow port 80
sudo ufw allow 80/tcp

# Check if Nginx is listening on all interfaces
sudo netstat -tulpn | grep :80

# Verify server IP
ip addr show
```

---

## 🔄 Updating the Application

### Update Backend Code

```bash
# Stop the backend
pm2 stop property-backend

# Pull latest changes (if using Git)
cd /var/www/property-management/backend
git pull origin main

# Install new dependencies
npm install --production

# Run migrations if any
node scripts/sync-database.js

# Restart
pm2 restart property-backend

# Check logs
pm2 logs property-backend --lines 50
```

### Update Frontend

```bash
# On your local machine, rebuild
cd project/frontend
npm run build

# Transfer new dist folder
scp -r dist user@192.168.1.109:/var/www/property-management/frontend/

# Clear browser cache or hard refresh (Ctrl+Shift+R)
```

---

## 📱 Access Information

### Server Access
- **IP Address**: 192.168.1.109
- **Frontend URL**: http://192.168.1.109
- **Backend API**: http://192.168.1.109:4002/api
- **SSH**: ssh user@192.168.1.109

### Important Paths
- **Application Root**: /var/www/property-management
- **Backend**: /var/www/property-management/backend
- **Frontend**: /var/www/property-management/frontend/dist
- **Uploads**: /var/www/property-management/backend/public/uploads
- **Nginx Config**: /etc/nginx/sites-available/property-management
- **Nginx Logs**: /var/log/nginx/

### PM2 Commands Reference
```bash
pm2 status                    # View all processes
pm2 logs property-backend     # View logs
pm2 restart property-backend  # Restart
pm2 stop property-backend     # Stop
pm2 delete property-backend   # Remove from PM2
pm2 monit                     # Real-time monitoring
pm2 save                      # Save process list
```

---

## 🎉 Success Checklist

- [ ] Backend running on port 4002 (check with `pm2 status`)
- [ ] Nginx running and serving on port 80 (check with `sudo systemctl status nginx`)
- [ ] Can access login page at http://192.168.1.109
- [ ] Can login with valid credentials
- [ ] Dashboard loads correctly
- [ ] Images display correctly
- [ ] Database connection working
- [ ] PM2 configured to start on boot
- [ ] Firewall rules configured
- [ ] Backups configured (optional but recommended)

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check PM2 logs: `pm2 logs property-backend --lines 200`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/property-management-error.log`
3. Check database connection: `mysql -u property_user -p property_management`
4. Verify environment variables: `cd /var/www/property-management/backend && cat .env`

---

**Deployment Date**: $(date)  
**Version**: 1.0  
**Server**: 192.168.1.109

