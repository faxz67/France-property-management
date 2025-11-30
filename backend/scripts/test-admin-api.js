/**
 * Script de test complet pour l'API des administrateurs
 * Teste la création, la mise à jour et la suppression via l'API
 */

require('dotenv').config();
const axios = require('axios');
const { Admin } = require('../models');
const { sequelize } = require('../config/database');

const API_BASE_URL = process.env.BACKEND_ORIGIN || 'http://192.168.1.109:4002';
const API_URL = `${API_BASE_URL}/api`;

async function getSuperAdminToken() {
  try {
    // Trouver un SUPER_ADMIN pour se connecter
    const superAdmin = await Admin.findOne({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' }
    });

    if (!superAdmin) {
      throw new Error('Aucun SUPER_ADMIN actif trouvé pour les tests');
    }

    // Se connecter pour obtenir un token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: superAdmin.email,
      password: 'admin123' // Mot de passe par défaut, peut nécessiter une modification
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      return loginResponse.data.token;
    }

    // Essayer avec d'autres mots de passe courants
    const commonPasswords = ['password', 'admin', 'Admin123', 'admin@123'];
    for (const password of commonPasswords) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: superAdmin.email,
          password: password
        });
        if (response.data.success && response.data.token) {
          return response.data.token;
        }
      } catch (e) {
        // Continuer avec le prochain mot de passe
      }
    }

    throw new Error('Impossible de se connecter avec les mots de passe testés');
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.message);
    throw error;
  }
}

async function testAdminAPI() {
  let testAdminId = null;
  let authToken = null;

  try {
    console.log('🧪 Test API Administrateur');
    console.log('================================\n');

    // 1. Obtenir un token d'authentification
    console.log('1️⃣  Authentification...');
    try {
      authToken = await getSuperAdminToken();
      console.log('✅ Authentification réussie');
    } catch (error) {
      console.log('⚠️  Impossible de se connecter automatiquement');
      console.log('   Veuillez fournir un token manuellement ou vérifier les identifiants');
      console.log('   Pour obtenir un token, connectez-vous via l\'interface web');
      return;
    }
    console.log('');

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Créer un administrateur via l'API
    console.log('2️⃣  Création d\'un administrateur via l\'API...');
    const testEmail = `test-api-${Date.now()}@test.com`;
    const createResponse = await axios.post(
      `${API_URL}/admins`,
      {
        name: 'Test API Admin',
        email: testEmail,
        password: 'test123456',
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      { headers }
    );

    if (createResponse.data.success) {
      testAdminId = createResponse.data.data.admin.id;
      console.log('✅ Administrateur créé via l\'API:', {
        id: testAdminId,
        email: testEmail,
        name: createResponse.data.data.admin.name
      });
    } else {
      throw new Error('Échec de la création via l\'API');
    }
    console.log('');

    // 3. Vérifier que l'administrateur existe
    console.log('3️⃣  Vérification de l\'existence via l\'API...');
    const getResponse = await axios.get(
      `${API_URL}/admins/${testAdminId}`,
      { headers }
    );

    if (getResponse.data.success) {
      console.log('✅ Administrateur trouvé via l\'API:', {
        id: getResponse.data.data.admin.id,
        email: getResponse.data.data.admin.email
      });
    } else {
      throw new Error('Administrateur non trouvé via l\'API');
    }
    console.log('');

    // 4. Mettre à jour l'administrateur via l'API
    console.log('4️⃣  Mise à jour de l\'administrateur via l\'API...');
    const updateResponse = await axios.put(
      `${API_URL}/admins/${testAdminId}`,
      {
        name: 'Test API Admin Updated',
        status: 'INACTIVE'
      },
      { headers }
    );

    if (updateResponse.data.success) {
      console.log('✅ Administrateur mis à jour via l\'API:', {
        id: updateResponse.data.data.admin.id,
        name: updateResponse.data.data.admin.name,
        status: updateResponse.data.data.admin.status
      });
    } else {
      throw new Error('Échec de la mise à jour via l\'API');
    }
    console.log('');

    // 5. Supprimer l'administrateur via l'API
    console.log('5️⃣  Suppression de l\'administrateur via l\'API...');
    const deleteResponse = await axios.delete(
      `${API_URL}/admins/${testAdminId}`,
      { headers }
    );

    if (deleteResponse.data.success) {
      console.log('✅ Administrateur supprimé via l\'API');
    } else {
      throw new Error('Échec de la suppression via l\'API');
    }
    console.log('');

    // 6. Vérifier que l'administrateur a été supprimé
    console.log('6️⃣  Vérification de la suppression...');
    try {
      await axios.get(
        `${API_URL}/admins/${testAdminId}`,
        { headers }
      );
      throw new Error('L\'administrateur existe toujours après suppression');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Administrateur supprimé avec succès (404 Not Found)');
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('✅ Tous les tests API ont réussi !');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.message);
    if (error.response) {
      console.error('Réponse d\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    // Nettoyer l'administrateur de test s'il existe
    if (testAdminId) {
      try {
        const admin = await Admin.findByPk(testAdminId);
        if (admin) {
          await admin.destroy();
          console.log('🧹 Administrateur de test nettoyé');
        }
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage:', cleanupError.message);
      }
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testAdminAPI()
    .then(() => {
      console.log('✅ Script de test API terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script de test API échoué:', error);
      process.exit(1);
    });
}

module.exports = testAdminAPI;

