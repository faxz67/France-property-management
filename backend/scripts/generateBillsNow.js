/**
 * Script pour Générer les Factures Mensuelles Maintenant
 * 
 * Ce script déclenche la génération automatique de factures pour tous les locataires actifs
 * Utile pour tester ou générer des factures manuellement sans attendre le 1er du mois
 */

const BillGenerationService = require('../services/billGenerationService');

async function generateBillsNow() {
  try {
    console.log('🚀 Démarrage de la génération des factures mensuelles...');
    console.log('⏰ Date:', new Date().toISOString());
    console.log('');

    // Générer les factures pour le mois en cours
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    console.log(`📅 Génération pour le mois: ${currentMonth}`);
    console.log('');

    const result = await BillGenerationService.generateMonthlyBills(currentMonth);

    console.log('');
    console.log('========================================');
    console.log('📊 RÉSULTATS DE LA GÉNÉRATION');
    console.log('========================================');

    if (result.success) {
      console.log('✅ Génération réussie !');
      console.log('');
      console.log('📈 Statistiques:');
      console.log(`  • Factures générées: ${result.statistics.billsGenerated}`);
      console.log(`  • Factures ignorées: ${result.statistics.billsSkipped}`);
      console.log(`  • Erreurs: ${result.statistics.errors}`);
      console.log(`  • Locataires actifs: ${result.statistics.activeTenants}`);
      console.log(`  • Locataires sans propriété: ${result.statistics.tenantsWithoutProperty}`);
      console.log('');

      if (result.statistics.billsGenerated > 0 && result.statistics.totalAmount) {
        console.log('💰 Montants:');
        console.log(`  • Montant total: ${result.statistics.totalAmount.toFixed(2)}€`);
        console.log(`  • Montant moyen: ${(result.statistics.totalAmount / result.statistics.billsGenerated).toFixed(2)}€`);
        console.log('');
      }

      if (result.bills && result.bills.length > 0) {
        console.log('📋 Détails des factures générées:');
        console.log('');
        result.bills.forEach((bill, index) => {
          console.log(`${index + 1}. Facture #${bill.id}`);
          console.log(`   • Locataire: ${bill.tenant?.name || 'N/A'}`);
          console.log(`   • Propriété: ${bill.property?.title || 'N/A'}`);
          console.log(`   • Loyer: ${bill.rent_amount}€`);
          console.log(`   • Charges: ${bill.charges}€`);
          console.log(`   • Total: ${bill.total_amount}€`);
          console.log(`   • Date d'échéance: ${bill.due_date}`);
          console.log('');
        });
      }

      if (result.statistics.billsSkipped > 0) {
        console.log('⚠️  Factures ignorées:');
        console.log('   Des factures existent déjà pour certains locataires ce mois-ci.');
        console.log('');
      }

      if (result.statistics.errors > 0) {
        console.log('❌ Erreurs rencontrées lors de la génération.');
        console.log('   Consultez les logs pour plus de détails.');
        console.log('');
      }

      console.log('========================================');
      console.log('🎉 Génération terminée avec succès !');
      console.log('========================================');
    } else {
      console.log('❌ Échec de la génération');
      console.log(`Message: ${result.message}`);
      console.log('');
      
      if (result.error) {
        console.log('Erreur:', result.error);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERREUR FATALE');
    console.error('========================================');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Afficher les informations
console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     GÉNÉRATEUR AUTOMATIQUE DE FACTURES MENSUELLES          ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Exécuter la génération
generateBillsNow();

