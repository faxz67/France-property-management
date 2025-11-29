# 🚀 Quick Deployment Reference Card

## 📋 Pre-Flight Checklist

✅ **Local Machine (Windows)**
- [x] Frontend built: `project/frontend/dist/` folder exists
- [x] Configuration updated: API URL set to `http://192.168.1.109:4002/api`
- [x] Environment template created: `project/backend/env.production.template`

⚠️ **Server Requirements (192.168.1.109)**
- [ ] Ubuntu/Debian Linux
- [ ] Node.js v18+
- [ ] Nginx
- [ ] PM2
- [ ] MariaDB/MySQL

---

## ⚡ Quick Deploy Commands (On Server)

### 1️⃣ Setup (One-time)

```bash
# Install prerequisites
sudo apt update && sudo apt upgrade -y
sudo apt install nginx mariadb-server -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Create directory
sudo mkdir -p /var/www/property-management
sudo chown -R $USER:$USER /var/www/property-management
```

### 2️⃣ Database Setup

```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```

```sql
CREATE DATABASE property_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'property_user'@'localhost' IDENTIFIED BY 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON property_management.* TO 'property_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3️⃣ Deploy Backend

```bash
cd /var/www/property-management/backend

# Setup environment
cp env.production.template .env
nano .env  # Update DB_PASSWORD, JWT_SECRET, SESSION_SECRET

# Install & start
npm install --production
mkdir -p public/uploads
chmod -R 755 public/uploads
node scripts/sync-database.js
pm2 start server.js --name property-backend
pm2 save
pm2 startup
```

### 4️⃣ Deploy Frontend

```bash
# Nginx configuration
sudo cp /var/www/property-management/nginx.conf /etc/nginx/sites-available/property-management
sudo ln -s /etc/nginx/sites-available/property-management /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5️⃣ Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 4002/tcp
sudo ufw enable
```

---

## 🔍 Verification Commands

```bash
# Check backend
pm2 status
curl http://localhost:4002/api/auth/login

# Check frontend
curl http://localhost/

# View logs
pm2 logs property-backend
sudo tail -f /var/log/nginx/property-management-error.log
```

---

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://192.168.1.109 | Main application |
| Backend API | http://192.168.1.109:4002/api | REST API |
| SSH | ssh user@192.168.1.109 | Server access |

---

## 🔧 Common Commands

```bash
# PM2 Management
pm2 restart property-backend  # Restart backend
pm2 logs property-backend     # View logs
pm2 monit                     # Monitor

# Nginx Management
sudo systemctl restart nginx   # Restart Nginx
sudo nginx -t                  # Test config
sudo systemctl status nginx    # Check status

# Database
mysql -u property_user -p property_management  # Access DB

# Updates
cd /var/www/property-management/backend
git pull origin main           # Pull changes
npm install --production       # Install deps
pm2 restart property-backend   # Restart
```

---

## 🚨 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend not starting | `pm2 logs property-backend --err` |
| Port 4002 in use | `sudo netstat -tulpn \| grep :4002` then `pm2 restart property-backend` |
| Nginx 502 error | `pm2 restart property-backend` |
| Images not loading | `chmod -R 755 /var/www/property-management/backend/public/uploads` |
| Database error | Check credentials in `.env` file |

---

## 📦 File Transfer (From Windows)

```powershell
# Transfer backend
scp -r "C:\Users\faisa\Downloads\Rahim Anna France Project Home Sharing\project\backend" user@192.168.1.109:/var/www/property-management/

# Transfer frontend build
scp -r "C:\Users\faisa\Downloads\Rahim Anna France Project Home Sharing\project\frontend\dist" user@192.168.1.109:/var/www/property-management/frontend/

# Transfer nginx config
scp "C:\Users\faisa\Downloads\Rahim Anna France Project Home Sharing\project\nginx.conf" user@192.168.1.109:/var/www/property-management/
```

---

## ✅ Final Checklist

- [ ] Backend running: `pm2 status` shows "online"
- [ ] Nginx running: `sudo systemctl status nginx` shows "active"
- [ ] Can access: http://192.168.1.109
- [ ] Can login successfully
- [ ] Images display correctly
- [ ] PM2 starts on boot: `pm2 startup` configured

---

**📚 Full Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions

