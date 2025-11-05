#!/usr/bin/env node

/**
 * Script de synchronisation complète de la base de données
 * Synchronise les modèles Sequelize avec la base de données MariaDB
 */

const path = require('path');
const fs = require('fs');

// Configuration de la base de données
const { sequelize } = require('../config/database');

// Import des modèles
const Admin = require('../models/Admin');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const Bill = require('../models/Bill');
const Session = require('../models/Session');

// Configuration des associations
const setupAssociations = () => {
  console.log('🔗 Configuration des associations...');
  
  // Admin associations
  Admin.hasMany(Property, { 
    foreignKey: 'admin_id', 
    as: 'properties',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  Admin.hasMany(Tenant, { 
    foreignKey: 'admin_id', 
    as: 'tenants',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  Admin.hasMany(Bill, { 
    foreignKey: 'admin_id', 
    as: 'bills',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Property associations
  Property.belongsTo(Admin, { 
    foreignKey: 'admin_id', 
    as: 'admin'
  });
  
  Property.hasMany(Tenant, { 
    foreignKey: 'property_id', 
    as: 'tenants',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
  Property.hasMany(Bill, { 
    foreignKey: 'property_id', 
    as: 'bills',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Tenant associations
  Tenant.belongsTo(Admin, { 
    foreignKey: 'admin_id', 
    as: 'admin'
  });
  
  Tenant.belongsTo(Property, { 
    foreignKey: 'property_id', 
    as: 'property'
  });
  
  Tenant.hasMany(Bill, { 
    foreignKey: 'tenant_id', 
    as: 'bills',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Bill associations
  Bill.belongsTo(Admin, { 
    foreignKey: 'admin_id', 
    as: 'admin'
  });
  
  Bill.belongsTo(Property, { 
    foreignKey: 'property_id', 
    as: 'property'
  });
  
  Bill.belongsTo(Tenant, { 
    foreignKey: 'tenant_id', 
    as: 'tenant'
  });

  console.log('✅ Associations configurées');
};

// Fonction de test de connexion
const testConnection = async () => {
  try {
    console.log('🔌 Test de connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
};

// Fonction de synchronisation des modèles
const syncModels = async (force = false) => {
  try {
    console.log('🔄 Synchronisation des modèles...');
    
    const options = {
      force: force,
      alter: !force, // Si force=false, utilise alter pour modifier les tables existantes
      logging: console.log
    };

    // Synchronisation dans l'ordre des dépendances
    await Admin.sync(options);
    console.log('✅ Table admins synchronisée');
    
    await Property.sync(options);
    console.log('✅ Table properties synchronisée');
    
    await Tenant.sync(options);
    console.log('✅ Table tenants synchronisée');
    
    await Bill.sync(options);
    console.log('✅ Table bills synchronisée');
    
    await Session.sync(options);
    console.log('✅ Table sessions synchronisée');

    console.log('✅ Tous les modèles synchronisés');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    return false;
  }
};

// Fonction de création des données de test
const createTestData = async () => {
  try {
    console.log('🌱 Création des données de test...');
    
    // Vérifier si des données existent déjà
    const adminCount = await Admin.count();
    if (adminCount > 0) {
      console.log('ℹ️ Des données existent déjà, création des données de test ignorée');
      return true;
    }

    // Créer un SUPER_ADMIN
    const superAdmin = await Admin.create({
      name: 'Super Administrateur',
      email: 'superadmin@example.com',
      password: 'SuperAdmin123!',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });
    console.log('✅ Super Admin créé:', superAdmin.email);

    // Créer un ADMIN
    const admin = await Admin.create({
      name: 'Administrateur Test',
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('✅ Admin créé:', admin.email);

    // Créer des propriétés pour l'admin
    const property1 = await Property.create({
      admin_id: admin.id,
      title: 'Appartement T2 - Centre Ville',
      description: 'Bel appartement de 2 pièces en centre-ville',
      address: '123 Rue de la Paix',
      city: 'Paris',
      postal_code: '75001',
      country: 'France',
      property_type: 'APARTMENT',
      monthly_rent: 1200.00,
      number_of_rooms: 2,
      number_of_bathrooms: 1,
      number_of_kitchens: 1
    });
    console.log('✅ Propriété créée:', property1.title);

    const property2 = await Property.create({
      admin_id: admin.id,
      title: 'Maison T3 - Banlieue',
      description: 'Maison familiale avec jardin',
      address: '456 Avenue des Lilas',
      city: 'Lyon',
      postal_code: '69000',
      country: 'France',
      property_type: 'HOUSE',
      monthly_rent: 1500.00,
      number_of_rooms: 3,
      number_of_bathrooms: 2,
      number_of_kitchens: 1,
      number_of_gardens: 1
    });
    console.log('✅ Propriété créée:', property2.title);

    // Créer des locataires
    const tenant1 = await Tenant.create({
      admin_id: admin.id,
      property_id: property1.id,
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33123456789',
      lease_start: '2024-01-01',
      lease_end: '2024-12-31',
      rent_amount: 1200.00,
      join_date: '2024-01-01',
      status: 'ACTIVE'
    });
    console.log('✅ Locataire créé:', tenant1.name);

    const tenant2 = await Tenant.create({
      admin_id: admin.id,
      property_id: property2.id,
      name: 'Marie Martin',
      email: 'marie.martin@email.com',
      phone: '+33987654321',
      lease_start: '2024-02-01',
      lease_end: '2025-01-31',
      rent_amount: 1500.00,
      join_date: '2024-02-01',
      status: 'ACTIVE'
    });
    console.log('✅ Locataire créé:', tenant2.name);

    // Créer des factures
    const bill1 = await Bill.create({
      tenant_id: tenant1.id,
      property_id: property1.id,
      admin_id: admin.id,
      amount: 1200.00,
      rent_amount: 1200.00,
      charges: 0.00,
      total_amount: 1200.00,
      month: '2024-10',
      due_date: '2024-11-01',
      status: 'PENDING',
      description: 'Paiement de loyer mensuel',
      bill_date: '2024-10-01',
      language: 'fr'
    });
    console.log('✅ Facture créée pour:', tenant1.name);

    const bill2 = await Bill.create({
      tenant_id: tenant2.id,
      property_id: property2.id,
      admin_id: admin.id,
      amount: 1500.00,
      rent_amount: 1500.00,
      charges: 0.00,
      total_amount: 1500.00,
      month: '2024-10',
      due_date: '2024-11-01',
      status: 'PAID',
      payment_date: '2024-10-15',
      description: 'Paiement de loyer mensuel',
      bill_date: '2024-10-01',
      language: 'fr'
    });
    console.log('✅ Facture créée pour:', tenant2.name);

    console.log('✅ Données de test créées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error.message);
    return false;
  }
};

// Fonction principale
const main = async () => {
  console.log('🚀 Démarrage de la synchronisation de la base de données');
  console.log('='.repeat(60));

  try {
    // Test de connexion
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }

    // Configuration des associations
    setupAssociations();

    // Synchronisation des modèles
    const synced = await syncModels(false); // alter=true pour modifier les tables existantes
    if (!synced) {
      process.exit(1);
    }

    // Création des données de test
    await createTestData();

    console.log('='.repeat(60));
    console.log('✅ Synchronisation de la base de données terminée avec succès');
    console.log('');
    console.log('📊 Résumé:');
    console.log('- Tables synchronisées: admins, properties, tenants, bills, sessions');
    console.log('- Associations configurées');
    console.log('- Données de test créées (si nécessaire)');
    console.log('');
    console.log('🔑 Comptes de test:');
    console.log('- Super Admin: superadmin@example.com / SuperAdmin123!');
    console.log('- Admin: admin@example.com / Admin123!');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion fermée');
  }
};

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  testConnection,
  syncModels,
  createTestData,
  setupAssociations
};
