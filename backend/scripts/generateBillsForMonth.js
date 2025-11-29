/**
 * Script pour Générer les Factures pour un Mois Spécifique
 * 
 * Usage: node scripts/generateBillsForMonth.js [YYYY-MM]
 * Exemple: node scripts/generateBillsForMonth.js 2025-11
 * 
 * Si aucun mois n'est spécifié, génère pour le mois en cours
 */

const BillGenerationService = require('../services/billGenerationService');

async function generateBillsForMonth(month) {
  try {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     GÉNÉRATEUR DE FACTURES POUR UN MOIS SPÉCIFIQUE         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📅 Mois: ${month}`);
    console.log(`⏰ Date d'exécution: ${new Date().toLocaleString('fr-FR')}`);
    console.log('');
    console.log('========================================');
    console.log('');

    const result = await BillGenerationService.generateMonthlyBills(month);

    console.log('');
    console.log('========================================');
    console.log('📊 RÉSULTATS');
    console.log('========================================');

    if (result.success) {
      const stats = result.statistics;
      
      console.log('✅ Génération terminée avec succès !');
      console.log('');
      console.log('📈 Statistiques:');
      console.log(`  ✓ Factures générées:  ${stats.billsGenerated}`);
      console.log(`  ⏭  Factures ignorées:  ${stats.billsSkipped}`);
      console.log(`  ❌ Erreurs:            ${stats.errors}`);
      console.log('');

      if (stats.billsGenerated > 0) {
        console.log('🎉 Nouvelles factures créées !');
        console.log('');
        
        if (result.bills && result.bills.length > 0) {
          console.log('📋 Détails:');
          console.log('');
          result.bills.forEach((bill, index) => {
            console.log(`${index + 1}. Facture #${bill.id}`);
            console.log(`   Locataire:  ${bill.tenant?.name || 'N/A'}`);
            console.log(`   Propriété:  ${bill.property?.title || 'N/A'}`);
            console.log(`   Loyer:      ${bill.rent_amount}€`);
            console.log(`   Charges:    ${bill.charges}€`);
            console.log(`   Total:      ${bill.total_amount}€`);
            console.log(`   Échéance:   ${bill.due_date}`);
            console.log('');
          });
        }
      } else if (stats.billsSkipped > 0) {
        console.log('ℹ️  Toutes les factures existent déjà pour ce mois.');
        console.log('');
      } else {
        console.log('⚠️  Aucun locataire actif trouvé.');
        console.log('');
      }

      if (stats.errors > 0) {
        console.log('⚠️  Certaines factures n\'ont pas pu être générées.');
        console.log('   Consultez les logs pour plus de détails.');
        console.log('');
      }
    } else {
      console.log('❌ Échec de la génération');
      console.log(`   ${result.message}`);
      console.log('');
    }

    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR FATALE');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

// Récupérer le mois depuis les arguments ou utiliser le mois en cours
const args = process.argv.slice(2);
let month;

if (args.length > 0) {
  month = args[0];
  
  // Valider le format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    console.error('');
    console.error('❌ Format de mois invalide !');
    console.error('');
    console.error('Usage: node scripts/generateBillsForMonth.js YYYY-MM');
    console.error('Exemple: node scripts/generateBillsForMonth.js 2025-11');
    console.error('');
    process.exit(1);
  }
} else {
  // Mois en cours
  month = new Date().toISOString().slice(0, 7);
}

// Exécuter
generateBillsForMonth(month);

