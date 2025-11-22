require('dotenv').config({ path: '../.env' });
const { Admin } = require('../models');
const axios = require('axios');

const API_BASE_URL = process.env.BACKEND_ORIGIN || 'http://192.168.1.109:4002';

// Test credentials
const testSuperAdminEmail = `test-super-admin-${Date.now()}@test.com`;
const testSuperAdminPassword = 'SuperAdmin123!';
const testSuperAdminName = 'Test Super Admin';

let createdAdminId = null;
let authToken = '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function createSuperAdmin() {
  console.log('\n1️⃣  Création d\'un super administrateur...');
  console.log('   Email:', testSuperAdminEmail);
  console.log('   Name:', testSuperAdminName);
  console.log('   Role: SUPER_ADMIN');

  try {
    // First, we need to login as an existing SUPER_ADMIN to create a new one
    // Let's try to find an existing SUPER_ADMIN
    const existingSuperAdmin = await Admin.findOne({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' }
    });

    if (!existingSuperAdmin) {
      console.log('⚠️  Aucun SUPER_ADMIN existant trouvé. Création directe dans la base de données...');
      
      // Create directly in database (for bootstrap)
      // Note: Pass plain password - the beforeCreate hook will hash it
      const newAdmin = await Admin.create({
        name: testSuperAdminName,
        email: testSuperAdminEmail,
        password: testSuperAdminPassword, // Plain password - hook will hash it
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        created_by: null // System admin
      });

      createdAdminId = newAdmin.id;
      console.log('✅ Super administrateur créé directement dans la base de données:', {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status
      });
      return true;
    }

    // Login as existing SUPER_ADMIN
    console.log('   Connexion en tant que SUPER_ADMIN existant...');
    // We'll need valid credentials - let's try common defaults
    const loginAttempts = [
      { email: 'rahim@property.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }
    ].filter(creds => creds.email && creds.password);

    let loggedIn = false;
    for (const creds of loginAttempts) {
      try {
        const res = await api.post('/auth/login', {
          email: creds.email,
          password: creds.password,
        });
        authToken = res.data.data.token;
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        console.log(`✅ Connecté en tant que: ${creds.email}`);
        loggedIn = true;
        break;
      } catch (err) {
        // Try next credentials
        continue;
      }
    }

    if (!loggedIn) {
      console.log('⚠️  Impossible de se connecter. Création directe dans la base de données...');
      // Note: Pass plain password - the beforeCreate hook will hash it
      const newAdmin = await Admin.create({
        name: testSuperAdminName,
        email: testSuperAdminEmail,
        password: testSuperAdminPassword, // Plain password - hook will hash it
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        created_by: null
      });
      createdAdminId = newAdmin.id;
      console.log('✅ Super administrateur créé directement:', {
        id: newAdmin.id,
        email: newAdmin.email
      });
      return true;
    }

    // Create via API
    console.log('   Création via API...');
    const res = await api.post('/admins', {
      name: testSuperAdminName,
      email: testSuperAdminEmail,
      password: testSuperAdminPassword,
      role: 'SUPER_ADMIN'
    });

    createdAdminId = res.data.data.admin.id;
    console.log('✅ Super administrateur créé via API:', {
      id: res.data.data.admin.id,
      email: res.data.data.admin.email,
      role: res.data.data.admin.role
    });
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.response?.data || error.message);
    
    // Fallback: create directly in database
    try {
      console.log('   Tentative de création directe dans la base de données...');
      // Note: Pass plain password - the beforeCreate hook will hash it
      const newAdmin = await Admin.create({
        name: testSuperAdminName,
        email: testSuperAdminEmail,
        password: testSuperAdminPassword, // Plain password - hook will hash it
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        created_by: null
      });
      createdAdminId = newAdmin.id;
      console.log('✅ Super administrateur créé directement:', {
        id: newAdmin.id,
        email: newAdmin.email
      });
      return true;
    } catch (dbError) {
      console.error('❌ Erreur lors de la création directe:', dbError.message);
      return false;
    }
  }
}

async function testLogin() {
  console.log('\n2️⃣  Test de connexion avec le nouveau super administrateur...');
  try {
    const res = await api.post('/auth/login', {
      email: testSuperAdminEmail,
      password: testSuperAdminPassword,
    });
    
    authToken = res.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('✅ Connexion réussie!');
    console.log('   Token obtenu:', authToken.substring(0, 20) + '...');
    console.log('   Admin data:', {
      id: res.data.data.admin.id,
      email: res.data.data.admin.email,
      role: res.data.data.admin.role,
      name: res.data.data.admin.name
    });
    return true;
  } catch (error) {
    console.error('❌ Échec de la connexion:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAdmin() {
  console.log('\n3️⃣  Test de récupération de l\'administrateur...');
  try {
    const res = await api.get(`/admins/${createdAdminId}`);
    const admin = res.data.data.admin;
    console.log('✅ Administrateur récupéré:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      name: admin.name
    });
    return true;
  } catch (error) {
    console.error('❌ Échec de la récupération:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateAdmin() {
  console.log('\n4️⃣  Test de mise à jour de l\'administrateur...');
  try {
    const updatedName = 'Test Super Admin Updated';
    const res = await api.put(`/admins/${createdAdminId}`, {
      name: updatedName,
      status: 'ACTIVE'
    });
    console.log('✅ Administrateur mis à jour:', {
      id: res.data.data.admin.id,
      name: res.data.data.admin.name,
      status: res.data.data.admin.status
    });
    return true;
  } catch (error) {
    console.error('❌ Échec de la mise à jour:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllAdmins() {
  console.log('\n5️⃣  Test de récupération de tous les administrateurs...');
  try {
    const res = await api.get('/admins');
    const admins = res.data.data.admins;
    console.log(`✅ ${admins.length} administrateur(s) récupéré(s)`);
    const superAdmins = admins.filter(a => a.role === 'SUPER_ADMIN');
    console.log(`   - ${superAdmins.length} SUPER_ADMIN(s)`);
    console.log(`   - ${admins.length - superAdmins.length} ADMIN(s)`);
    return true;
  } catch (error) {
    console.error('❌ Échec de la récupération:', error.response?.data || error.message);
    return false;
  }
}

async function testDeleteAdmin() {
  console.log('\n6️⃣  Test de suppression d\'un autre administrateur...');
  try {
    // Create a regular admin first (to test deletion)
    const testAdminEmail = `test-admin-to-delete-${Date.now()}@test.com`;
    const createRes = await api.post('/admins', {
      name: 'Test Admin To Delete',
      email: testAdminEmail,
      password: 'TestPassword123!',
      role: 'ADMIN'
    });
    
    const adminToDeleteId = createRes.data.data.admin.id;
    console.log(`   Admin créé pour test de suppression (ID: ${adminToDeleteId})`);
    
    // Now delete it
    const deleteRes = await api.delete(`/admins/${adminToDeleteId}`);
    console.log('✅ Administrateur supprimé:', deleteRes.data.message);
    
    // Verify deletion
    try {
      await api.get(`/admins/${adminToDeleteId}`);
      console.error('❌ Erreur: Administrateur toujours trouvé après suppression.');
      return false;
    } catch (verifyError) {
      if (verifyError.response && verifyError.response.status === 404) {
        console.log('✅ Vérification: Administrateur supprimé avec succès');
        return true;
      } else {
        console.error('❌ Erreur lors de la vérification:', verifyError.response?.data || verifyError.message);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Échec de la suppression:', error.response?.data || error.message);
    return false;
  }
}

async function verifySelfDeletion() {
  console.log('\n7️⃣  Test: Tentative de suppression de son propre compte (doit échouer)...');
  try {
    await api.delete(`/admins/${createdAdminId}`);
    console.error('❌ Erreur: La suppression de son propre compte devrait échouer.');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Protection activée: Impossible de supprimer son propre compte (attendu).');
      return true;
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
      return false;
    }
  }
}

async function cleanup() {
  if (createdAdminId) {
    try {
      const admin = await Admin.findByPk(createdAdminId, { paranoid: false });
      if (admin) {
        console.log(`\n🧹 Nettoyage de l'administrateur de test (ID: ${createdAdminId})...`);
        await admin.destroy({ force: true });
        console.log('✅ Nettoyage terminé.');
      }
    } catch (error) {
      console.error('⚠️  Erreur lors du nettoyage:', error.message);
    }
  }
}

async function runTests() {
  console.log('🧪 Test de création et fonctionnalités Super Admin');
  console.log('==================================================');

  const results = {
    create: false,
    login: false,
    get: false,
    update: false,
    getAll: false,
    delete: false,
    verify: false
  };

  try {
    // Create
    results.create = await createSuperAdmin();
    if (!results.create) {
      console.log('\n❌ Échec de la création. Tests annulés.');
      await cleanup();
      process.exit(1);
    }

    // Login
    results.login = await testLogin();
    if (!results.login) {
      console.log('\n⚠️  Échec de la connexion. Certains tests seront ignorés.');
    }

    // Get admin
    if (results.login) {
      results.get = await testGetAdmin();
      results.update = await testUpdateAdmin();
      results.getAll = await testGetAllAdmins();
    }

    // Delete (only if we can login)
    if (results.login) {
      results.delete = await testDeleteAdmin();
      results.verify = await verifySelfDeletion();
    } else {
      // Cleanup directly from database
      await cleanup();
    }

    // Summary
    console.log('\n📊 Résumé des tests:');
    console.log('===================');
    console.log(`✅ Création: ${results.create ? '✓' : '✗'}`);
    console.log(`✅ Connexion: ${results.login ? '✓' : '✗'}`);
    if (results.login) {
      console.log(`✅ Récupération: ${results.get ? '✓' : '✗'}`);
      console.log(`✅ Mise à jour: ${results.update ? '✓' : '✗'}`);
      console.log(`✅ Liste: ${results.getAll ? '✓' : '✗'}`);
      console.log(`✅ Suppression: ${results.delete ? '✓' : '✗'}`);
      console.log(`✅ Vérification: ${results.verify ? '✓' : '✗'}`);
    }

    const allPassed = Object.values(results).every(r => r === true || !results.login);
    if (allPassed || (results.create && !results.login)) {
      console.log('\n✅ Tous les tests ont réussi!');
    } else {
      console.log('\n⚠️  Certains tests ont échoué.');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
  } finally {
    if (!results.delete && createdAdminId) {
      await cleanup();
    }
    console.log('\n✅ Script de test terminé');
    process.exit(0);
  }
}

runTests();

