# 🏢 Property Management System

A comprehensive property rental management system built with modern technologies. Manage properties, tenants, bills, and track profits with automated features.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

### 🏠 Property Management
- Add, edit, and delete properties
- Upload and manage multiple photos per property
- Track property details (rooms, amenities, etc.)
- View property statistics and occupancy

### 👥 Tenant Management
- Manage tenant information
- Upload and store tenant documents
- Track lease dates and rent amounts
- Monitor tenant status

### 💰 Bill Management
- Automatic monthly bill generation
- Manual bill creation and editing
- Track payment status
- Generate PDF invoices in French
- Auto-calculate profits when bills are paid

### 📊 Analytics & Reporting
- Dashboard with key metrics
- Revenue tracking and profit analysis
- Payment statistics
- Expense tracking and budgeting
- Export reports

### 🔐 Security
- JWT authentication
- Role-based access control (SUPER_ADMIN, ADMIN)
- Session management
- Secure file uploads
- Data validation and sanitization

### 🌍 Internationalization
- French localization
- French date and currency formatting
- French PDF templates

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- MariaDB/MySQL ≥ 10.5
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd property-management-system

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# Install frontend dependencies
cd ../frontend
npm install

# Start development servers
npm run dev:all  # Starts both backend and frontend
```

### Environment Setup

**Backend** (.env):
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=property_rental
DB_USER=root
DB_PASSWORD=your_password

# Server
PORT=4002
BACKEND_ORIGIN=http://localhost:4002
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

**Frontend** (.env):
```env
VITE_API_BASE_URL=http://localhost:4002/api
```

### Access the Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:4002/api
- **API Health**: http://localhost:4002/health

### Default Credentials

```
Email: admin@example.com
Password: admin123
```

---

## 📁 Project Structure

```
property-management-system/
├── backend/              # Node.js/Express API
├── frontend/             # React/TypeScript app
├── docs/                 # Documentation
├── deployment/           # Deployment configs
└── README.md            # This file
```

For detailed structure, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MariaDB with Sequelize ORM
- **Authentication**: JWT
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Email**: Nodemailer
- **Cron Jobs**: node-cron

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Routing**: React Router (if applicable)

---

## 📖 Documentation

- [📘 Quick Start Guide](docs/guides/quick-start.md)
- [🏗️ Architecture](docs/ARCHITECTURE.md)
- [🔌 API Documentation](docs/API.md)
- [🚀 Deployment Guide](docs/DEPLOYMENT.md)
- [🔒 Security Guidelines](docs/SECURITY.md)
- [🐛 Troubleshooting](docs/guides/troubleshooting.md)

### Feature Documentation
- [📸 Photo Upload System](docs/features/photo-upload.md)
- [💰 Profit Tracking](docs/features/profit-tracking.md)
- [📄 Bill Generation](docs/features/bill-generation.md)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📦 Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build output will be in frontend/dist/

# Backend doesn't need building (uses Node.js directly)
# Just set NODE_ENV=production
```

---

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Backend
cd backend
pm2 start ecosystem.config.js

# Frontend (serve with nginx)
# See docs/DEPLOYMENT.md
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

For detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 API Overview

### Authentication
```http
POST   /api/auth/login          # Login
POST   /api/auth/register       # Register
GET    /api/auth/profile        # Get profile
PUT    /api/auth/profile        # Update profile
```

### Properties
```http
GET    /api/properties          # List properties
POST   /api/properties          # Create property
PUT    /api/properties/:id      # Update property
DELETE /api/properties/:id      # Delete property
```

### Property Photos
```http
POST   /api/properties/:id/photos              # Upload photos
GET    /api/properties/:id/photos              # Get photos
DELETE /api/properties/:id/photos/:photoId     # Delete photo
PUT    /api/properties/:id/photos/:photoId/primary  # Set primary
```

### Tenants
```http
GET    /api/tenants             # List tenants
POST   /api/tenants             # Create tenant
PUT    /api/tenants/:id         # Update tenant
DELETE /api/tenants/:id         # Delete tenant
```

### Bills
```http
GET    /api/bills               # List bills
POST   /api/bills               # Create bill
PUT    /api/bills/:id           # Update bill
DELETE /api/bills/:id           # Delete bill
PUT    /api/bills/:id/pay       # Mark as paid
PUT    /api/bills/:id/undo      # Undo payment
GET    /api/bills/stats         # Get statistics
GET    /api/bills/profits/total # Get total profit
```

Full API documentation: [docs/API.md](docs/API.md)

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check database connection
mysql -u root -p
USE property_rental;

# Check Node.js version
node --version  # Should be >= 18

# Check logs
tail -f backend/logs/error.log
```

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat .env
```

### Photos not displaying
```bash
# Check uploads directory permissions
ls -la backend/public/uploads/

# Check backend logs
grep "getFileUrl" backend/logs/combined.log
```

For more, see [Troubleshooting Guide](docs/guides/troubleshooting.md)

---

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Storage**: 10 GB
- **Database**: MariaDB 10.5+

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Database**: MariaDB 10.11+
- **CDN**: For file uploads (Cloudflare R2, AWS S3)

---

## 📈 Roadmap

- [ ] Multi-language support (English, Arabic)
- [ ] Mobile app (React Native)
- [ ] WhatsApp notifications
- [ ] Online payment integration
- [ ] Advanced analytics with charts
- [ ] Maintenance request tracking
- [ ] Lease contract generation
- [ ] Automated rent reminders

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Lead Developer**: Senior Development Team
- **Contributors**: See [CONTRIBUTORS.md](docs/CONTRIBUTORS.md)

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/property-management/issues)
- **Email**: support@yourcompany.com

---

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern SaaS applications
- Built with ❤️ using open-source technologies

---

## 📊 Status

- ✅ **Backend API**: Fully functional
- ✅ **Frontend**: Production ready
- ✅ **Database**: Optimized schema
- ✅ **Security**: JWT + RBAC implemented
- ✅ **File Uploads**: Working perfectly
- ✅ **PDF Generation**: French templates ready
- ✅ **Profit Tracking**: Automated
- ✅ **Bill Generation**: Automated monthly

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Status**: 🟢 Production Ready

---

Made with ❤️ by the Development Team
