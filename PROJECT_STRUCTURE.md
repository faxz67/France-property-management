# 📁 Structure du Projet

## Vue d'ensemble

```
project/
├── backend/                 # API Backend (Node.js/Express)
├── frontend/               # Application Frontend (React/TypeScript)
├── build-production.sh     # Script de build production
├── deploy.sh               # Script de déploiement complet
├── nginx.conf              # Configuration Nginx
├── .gitignore              # Fichiers ignorés par Git
├── README.md               # Documentation principale
└── PROJECT_STRUCTURE.md    # Ce fichier
```

---

## 🗂️ Backend Structure

```
backend/
├── config/                 # Configuration
│   └── database.js         # Configuration base de données Sequelize
│
├── controllers/            # Contrôleurs (logique métier)
│   ├── adminController.js
│   ├── analyticsController.js
│   ├── authController.js
│   ├── billController.js
│   ├── propertyController.js
│   ├── propertyPhotoController.js
│   ├── tenantController.js
│   └── tenantDocumentController.js
│
├── middleware/             # Middleware Express
│   ├── auth.js            # Authentification JWT
│   └── validation.js      # Validation des données
│
├── models/                 # Modèles Sequelize (ORM)
│   ├── index.js           # Initialisation Sequelize
│   ├── Admin.js
│   ├── Bill.js
│   ├── Budget.js
│   ├── Expense.js
│   ├── Profit.js
│   ├── Property.js
│   ├── PropertyPhoto.js
│   ├── Receipt.js
│   ├── Session.js
│   ├── Tenant.js
│   └── TenantDocument.js
│
├── routes/                 # Routes API
│   ├── admins.js
│   ├── analytics.js
│   ├── auth.js
│   ├── bills.js
│   ├── expenses.js
│   ├── properties.js
│   └── tenants.js
│
├── services/               # Services métier
│   ├── billGenerationService.js  # Génération automatique de factures
│   ├── billScheduler.js           # Planification des factures
│   ├── cronService.js             # Tâches cron
│   ├── emailService.js            # Service email
│   ├── frenchBillTemplate.js      # Template PDF facture française
│   └── pdfService.js              # Génération PDF
│
├── utils/                  # Utilitaires
│   ├── fileUpload.js       # Gestion upload fichiers
│   └── mailer.js           # Configuration email
│
├── scripts/                 # Scripts utilitaires
│   ├── cleanup-sessions.js        # Nettoyage sessions
│   ├── fixBillScheduler.js        # Correction planificateur
│   ├── generateBillsForMonth.js   # Génération factures mensuelles
│   ├── generateBillsNow.js        # Génération factures immédiate
│   ├── maintenance.js             # Maintenance système
│   ├── setup-production.sh        # Configuration production
│   └── sync-database.js            # Synchronisation base de données
│
├── public/                 # Fichiers statiques
│   └── uploads/            # Fichiers uploadés (photos, documents)
│
├── uploads/                # Uploads temporaires
│   └── bills/              # Factures PDF générées
│
├── backups/                # Sauvegardes base de données
│
├── server.js               # Point d'entrée serveur
├── package.json            # Dépendances Node.js
├── ecosystem.config.js     # Configuration PM2
├── deploy-production.sh    # Script déploiement backend
└── env.example             # Exemple variables d'environnement
```

### 📝 Notes Backend

- **Architecture**: MVC (Model-View-Controller)
- **ORM**: Sequelize pour MariaDB
- **Authentification**: JWT (JSON Web Tokens)
- **Upload**: Multer pour fichiers
- **PDF**: PDFKit pour génération factures
- **Cron**: node-cron pour tâches automatiques

---

## 🎨 Frontend Structure

```
frontend/
├── src/
│   ├── components/         # Composants React réutilisables
│   │   ├── AnalyticsOverview.tsx
│   │   ├── AnimatedStatCard.tsx
│   │   ├── ApiDiagnostics.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageTransition.tsx
│   │   ├── PaymentsManagement.tsx
│   │   ├── PaymentTracking.tsx
│   │   ├── ProfessionalCard.tsx
│   │   ├── PropertiesSection.tsx
│   │   ├── PropertyPhotos.tsx
│   │   ├── RentabilityDashboard.tsx
│   │   ├── ScrollReveal.tsx
│   │   ├── TenantDocuments.tsx
│   │   └── TunnetSectionFixed.tsx
│   │
│   ├── pages/              # Pages de l'application
│   │   ├── AdminManagement.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ExpenseAnalytics.tsx
│   │   └── Login.tsx
│   │
│   ├── services/           # Services frontend
│   │   ├── dataService.ts  # Service gestion données
│   │   └── dataService.d.ts
│   │
│   ├── config/             # Configuration
│   │   └── api.config.ts   # Configuration API client
│   │
│   ├── utils/              # Utilitaires
│   │   ├── apiErrors.ts    # Gestion erreurs API
│   │   ├── apiRetry.ts     # Retry automatique API
│   │   ├── dateUtils.ts    # Utilitaires dates
│   │   ├── dateUtils.d.ts
│   │   ├── debounce.ts     # Fonction debounce
│   │   ├── formValidation.ts  # Validation formulaires
│   │   ├── imageUtils.ts   # Utilitaires images
│   │   ├── logger.ts       # Système de logs
│   │   └── security.ts     # Sécurité (sanitization)
│   │
│   ├── types/              # Types TypeScript
│   │   └── api.types.ts    # Types API
│   │
│   ├── styles/             # Fichiers CSS
│   │   ├── navigation-animations.css
│   │   ├── payments-animations.css
│   │   ├── professional-animations.css
│   │   └── smooth-animations.css
│   │
│   ├── api.js              # Client API (Axios)
│   ├── api.d.ts            # Types TypeScript pour API
│   ├── App.tsx             # Composant racine
│   ├── main.tsx            # Point d'entrée React
│   ├── index.css           # Styles globaux
│   └── vite-env.d.ts       # Types Vite
│
├── public/                 # Fichiers statiques publics
├── dist/                   # Build de production
├── node_modules/           # Dépendances npm
├── package.json            # Configuration npm
├── vite.config.ts          # Configuration Vite
├── tailwind.config.js      # Configuration Tailwind CSS
├── tsconfig.json           # Configuration TypeScript
├── tsconfig.app.json       # Config TypeScript app
├── tsconfig.node.json      # Config TypeScript Node
├── eslint.config.js        # Configuration ESLint
├── postcss.config.js       # Configuration PostCSS
└── README.md               # Documentation frontend
```

### 📝 Notes Frontend

- **Framework**: React 18 avec TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios avec interceptors
- **Routing**: React Router
- **Icons**: Lucide React
- **Charts**: Recharts (pour analytics)

---

## 🔄 Flux de Données

```
Frontend (React) 
    ↓
api.js (Client Axios)
    ↓
Backend API (Express)
    ↓
Controllers (Logique métier)
    ↓
Models (Sequelize ORM)
    ↓
MariaDB Database
```

---

## 📦 Fichiers de Configuration Principaux

### Backend
- `server.js` - Point d'entrée serveur
- `package.json` - Dépendances Node.js
- `ecosystem.config.js` - Configuration PM2
- `.env` - Variables d'environnement (non versionné)
- `env.example` - Exemple variables d'environnement

### Frontend
- `vite.config.ts` - Configuration Vite
- `tsconfig.json` - Configuration TypeScript
- `tailwind.config.js` - Configuration Tailwind
- `package.json` - Dépendances npm
- `.env` - Variables d'environnement (non versionné)

### Déploiement
- `deploy.sh` - Script déploiement complet
- `build-production.sh` - Build production
- `nginx.conf` - Configuration Nginx
- `backend/deploy-production.sh` - Déploiement backend
- `backend/scripts/setup-production.sh` - Setup production

---

## 🗄️ Base de Données

### Tables Principales
- `admins` - Administrateurs
- `properties` - Propriétés
- `property_photos` - Photos propriétés
- `tenants` - Locataires
- `tenant_documents` - Documents locataires
- `bills` - Factures
- `receipts` - Reçus paiements
- `profits` - Profits trackés
- `expenses` - Dépenses
- `budgets` - Budgets
- `sessions` - Sessions utilisateurs

---

## 🔐 Sécurité

- **Authentification**: JWT tokens
- **Autorisation**: Rôles (SUPER_ADMIN, ADMIN)
- **Validation**: Middleware validation
- **Sanitization**: Utils sécurité frontend
- **Upload**: Validation fichiers
- **CORS**: Configuration stricte

---

## 🚀 Déploiement

### Production
- **Frontend**: Nginx (port 80)
- **Backend**: PM2 (port 4002)
- **Database**: MariaDB
- **Scripts**: `deploy.sh` pour déploiement automatique

---

**Dernière mise à jour**: 2025
**Version**: 1.0.0

