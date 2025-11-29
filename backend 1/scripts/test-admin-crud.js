/**
 * Script de test pour créer et supprimer un administrateur
 * Ce script teste les fonctionnalités CRUD des administrateurs
 */

require('dotenv').config();
const { Admin } = require('../models');
const { sequelize } = require('../config/database');

async function testAdminCRUD() {
  try {
    console.log('🧪 Test CRUD Administrateur');
    console.log('================================\n');

    // 1. Créer un administrateur de test
    console.log('1️⃣  Création d\'un administrateur de test...');
    const testAdmin = await Admin.create({
      name: 'Test Admin',
      email: `test-admin-${Date.now()}@test.com`,
      password: 'test123456',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    console.log('✅ Administrateur créé:', {
      id: testAdmin.id,
      name: testAdmin.name,
      email: testAdmin.email,
      role: testAdmin.role,
      status: testAdmin.status
    });
    console.log('');

    // 2. Vérifier que l'administrateur existe
    console.log('2️⃣  Vérification de l\'existence de l\'administrateur...');
    const foundAdmin = await Admin.findByPk(testAdmin.id);
    if (foundAdmin) {
      console.log('✅ Administrateur trouvé:', {
        id: foundAdmin.id,
        email: foundAdmin.email
      });
    } else {
      throw new Error('Administrateur non trouvé après création');
    }
    console.log('');

    // 3. Mettre à jour l'administrateur
    console.log('3️⃣  Mise à jour de l\'administrateur...');
    await foundAdmin.update({
      name: 'Test Admin Updated',
      status: 'INACTIVE'
    });
    await foundAdmin.reload();
    console.log('✅ Administrateur mis à jour:', {
      id: foundAdmin.id,
      name: foundAdmin.name,
      status: foundAdmin.status
    });
    console.log('');

    // 4. Supprimer l'administrateur
    console.log('4️⃣  Suppression de l\'administrateur...');
    await foundAdmin.destroy();
    console.log('✅ Administrateur supprimé avec succès');
    console.log('');

    // 5. Vérifier que l'administrateur a été supprimé
    console.log('5️⃣  Vérification de la suppression...');
    const deletedAdmin = await Admin.findByPk(testAdmin.id);
    if (!deletedAdmin) {
      console.log('✅ Administrateur supprimé avec succès (non trouvé dans la base de données)');
    } else {
      throw new Error('L\'administrateur existe toujours après suppression');
    }
    console.log('');

    console.log('✅ Tous les tests CRUD ont réussi !');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Détails:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testAdminCRUD()
    .then(() => {
      console.log('✅ Script de test terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script de test échoué:', error);
      process.exit(1);
    });
}

module.exports = testAdminCRUD;

