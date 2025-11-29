/**
 * Script pour Corriger le Planificateur de Factures
 * 
 * Ce script corrige le problème de génération de factures bloquée
 * et génère les factures manquantes pour les locataires actifs
 */

const BillGenerationService = require('../services/billGenerationService');
const billScheduler = require('../services/billScheduler');

async function fixBillScheduler() {
  try {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           CORRECTION DU PLANIFICATEUR DE FACTURES          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`⏰ Date d'exécution: ${new Date().toLocaleString('fr-FR')}`);
    console.log('');

    // 1. Vérifier le statut actuel
    console.log('1️⃣ Vérification du statut du planificateur...');
    const status = billScheduler.getStatus();
    console.log(`   Statut: ${status.status}`);
    console.log(`   En cours: ${status.isRunning ? 'OUI' : 'NON'}`);
    console.log('');

    // 2. Réinitialiser le flag si nécessaire
    if (status.isRunning) {
      console.log('2️⃣ Réinitialisation du flag de génération...');
      billScheduler.resetRunningFlag();
      console.log('   ✅ Flag réinitialisé');
    } else {
      console.log('2️⃣ Le flag est déjà libre');
    }
    console.log('');

    // 3. Générer les factures manquantes
    console.log('3️⃣ Génération des factures manquantes...');
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(`   Mois cible: ${currentMonth}`);
    
    const result = await BillGenerationService.generateMonthlyBills(currentMonth);
    
    console.log('');
    console.log('========================================');
    console.log('📊 RÉSULTATS DE LA CORRECTION');
    console.log('========================================');
    
    if (result.success) {
      const stats = result.statistics;
      console.log('✅ Correction réussie !');
      console.log(`📅 Mois: ${stats.month}`);
      console.log(`👥 Locataires actifs: ${stats.totalTenants}`);
      console.log(`📄 Factures générées: ${stats.billsGenerated}`);
      console.log(`⏭️  Factures ignorées: ${stats.billsSkipped}`);
      console.log(`❌ Erreurs: ${stats.errors}`);
      
      if (stats.errors > 0 && result.errorDetails) {
        console.log('');
        console.log('🔍 Détails des erreurs:');
        result.errorDetails.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.tenantName} (${error.tenantEmail}): ${error.error}`);
        });
      }
    } else {
      console.log('❌ Échec de la correction');
      console.log(`   Erreur: ${result.message}`);
    }

    console.log('');
    console.log('4️⃣ Vérification finale du statut...');
    const finalStatus = billScheduler.getStatus();
    console.log(`   Statut final: ${finalStatus.status}`);
    console.log(`   En cours: ${finalStatus.isRunning ? 'OUI' : 'NON'}`);
    
    console.log('');
    console.log('✅ Correction terminée !');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    console.log('');
    console.log('🔧 Solutions possibles:');
    console.log('   1. Vérifier la connexion à la base de données');
    console.log('   2. Vérifier que les modèles sont correctement définis');
    console.log('   3. Redémarrer le serveur si nécessaire');
  }
}

// Exécuter le script
fixBillScheduler()
  .then(() => {
    console.log('🎉 Script de correction terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
