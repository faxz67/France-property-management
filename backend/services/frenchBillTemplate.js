/**
 * French Bill Template Service
 * Generates French language bill templates and formatting
 */
class FrenchBillTemplate {
  
  /**
   * Generate French bill content
   * @param {Object} bill - Bill object with tenant, property, and admin data
   * @returns {Object} - Formatted bill content in French
   */
  static generateBillContent(bill) {
    const tenant = bill.tenant;
    const property = bill.property;
    const admin = bill.admin;
    
    // Format dates in French format (DD/MM/YYYY)
    const billDate = this.formatFrenchDate(bill.bill_date);
    const dueDate = this.formatFrenchDate(bill.due_date);
    const paymentDate = bill.payment_date ? this.formatFrenchDate(bill.payment_date) : '';
    const month = this.formatFrenchMonth(bill.month);
    
    // Calculate amounts - use new fields if available
    const rentAmount = parseFloat(bill.rent_amount || bill.amount);
    const charges = parseFloat(bill.charges) || 0;
    const totalAmount = parseFloat(bill.total_amount || bill.amount);
    
    // Build bill items array
    const billItems = [
      {
        description: 'Loyer',
        amount: rentAmount.toFixed(2),
        currency: '€'
      }
    ];

    // Add charges if applicable
    if (charges > 0) {
      billItems.push({
        description: 'Provision pour charges',
        amount: charges.toFixed(2),
        currency: '€'
      });
    }
    
    return {
      // Header
      title: 'QUITTANCE DE LOYER',
      subtitle: `Quittance de loyer du mois de ${month}`,
      
      // Bill information
      billInfo: {
        billNumber: `QUIT-${bill.id.toString().padStart(6, '0')}`,
        billDate: billDate,
        dueDate: dueDate,
        paymentDate: paymentDate,
        month: month,
        isPaid: bill.status === 'PAID'
      },
      
      // Landlord/Bailleur information
      landlordInfo: {
        title: 'BAILLEUR',
        name: 'Hisham', // Always use Hisham as requested
        email: admin?.email || '',
        address: property?.address || 'Adresse du bailleur',
        city: property?.city || 'Paris',
        postalCode: property?.postal_code || '75001',
        country: property?.country || 'France',
        company: 'Gestion Locative'
      },
      
      // Tenant information
      tenantInfo: {
        title: 'LOCATAIRE',
        name: tenant?.name || 'Non renseigné',
        email: tenant?.email || 'Non renseigné',
        phone: tenant?.phone || 'Non renseigné'
      },
      
      // Property information (Location)
      propertyInfo: {
        title: 'ADRESSE DE LA LOCATION',
        name: property?.title || 'Non renseigné',
        address: property?.address || 'Non renseigné',
        city: property?.city || 'Non renseigné',
        country: property?.country || 'France',
        fullAddress: `${property?.address || 'Non renseigné'}, ${property?.city || 'Non renseigné'}${property?.country ? ', ' + property.country : ''}`
      },
      
      // Payment details (Détail du règlement)
      billDetails: {
        title: 'DÉTAIL DU RÈGLEMENT',
        items: billItems,
        total: {
          label: 'TOTAL',
          amount: totalAmount.toFixed(2),
          currency: '€'
        }
      },
      
      // Payment information
      paymentInfo: {
        title: 'DÉCLARATION DE PAIEMENT',
        instructions: [
          `Le soussigné(e) Hisham, propriétaire du logement désigné ci-dessus, déclare avoir reçu de Monsieur/Madame ${tenant?.name || 'Non renseigné'}, la somme de ${totalAmount.toFixed(2)} euros (${this.numberToWords(totalAmount)}), au titre du paiement du loyer du mois de ${month} et lui en donne quittance, sous réserve de tous mes droits.`
        ],
        dueDate: `Date d'échéance: le ${dueDate}`,
        amount: `Montant: ${totalAmount.toFixed(2)} €`,
        paymentDate: `Fait à ${property?.city || 'Paris'}, le ${billDate}`
      },
      
      // Footer
      footer: {
        note: 'Ce modèle vous est présenté à titre indicatif. Il est destiné à vous aider à rédiger votre propre courrier. Il est donc de votre responsabilité de vérifier qu\'il en est bien ainsi et votre seule responsabilité de l\'utiliser. En cas de doute, veuillez consulter votre ADIL (pour connaître ADIL: www.anil.org).',
        system: 'Système de gestion immobilière',
        signature: '(Signature)'
      }
    };
  }
  
  /**
   * Format date to French format (DD/MM/YYYY)
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {string} - Formatted date
   */
  static formatFrenchDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Format month to French format
   * @param {string} monthString - Month string in YYYY-MM format
   * @returns {string} - Formatted month in French
   */
  static formatFrenchMonth(monthString) {
    if (!monthString) return '';
    
    const [year, month] = monthString.split('-');
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  /**
   * Convert number to French words (simplified version)
   * @param {number} amount - Amount to convert
   * @returns {string} - Amount in French words
   */
  static numberToWords(amount) {
    const num = Math.floor(amount);
    
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    if (num === 0) return 'zéro';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (ten === 7 || ten === 9) {
        const base = ten === 7 ? 60 : 80;
        const remainder = num - base;
        if (remainder < 10) return tens[ten] + (remainder > 0 ? '-' + units[remainder] : '');
        return tens[ten] + '-' + teens[remainder - 10];
      }
      return tens[ten] + (unit > 0 ? '-' + units[unit] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      let result = hundred === 1 ? 'cent' : units[hundred] + ' cent';
      if (remainder > 0) result += ' ' + this.numberToWords(remainder);
      return result;
    }
    
    // For larger numbers, return a simplified version
    return `${num} euros`;
  }
  
  /**
   * Generate French email subject for bill notification
   * @param {Object} bill - Bill object
   * @returns {string} - Email subject in French
   */
  static generateEmailSubject(bill) {
    const month = this.formatFrenchMonth(bill.month);
    return `Facture de loyer - ${month} - ${bill.tenant.name}`;
  }
  
  /**
   * Generate French email body for bill notification
   * @param {Object} bill - Bill object
   * @returns {string} - Email body in French
   */
  static generateEmailBody(bill) {
    const month = this.formatFrenchMonth(bill.month);
    const dueDate = this.formatFrenchDate(bill.due_date);
    const amount = parseFloat(bill.amount).toFixed(2);
    
    return `
Bonjour ${bill.tenant.name},

Votre facture de loyer pour le mois de ${month} est maintenant disponible.

Détails de la facture:
- Montant: ${amount} €
- Date d'échéance: ${dueDate}
- Propriété: ${bill.property.title}

Veuillez effectuer le paiement avant la date d'échéance pour éviter tout frais de pénalité.

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
${bill.admin.name}
Propriétaire
    `.trim();
  }
  
  /**
   * Generate French bill description
   * @param {Object} tenant - Tenant object
   * @param {number} rentAmount - Rent amount
   * @param {number} utilityCharges - Utility charges
   * @returns {string} - French description
   */
  static generateDescription(tenant, rentAmount, utilityCharges) {
    const propertyName = tenant.property?.title || 'Propriété';
    const tenantName = tenant.name;
    
    let description = `Facture mensuelle de loyer pour ${tenantName}\n`;
    description += `Propriété: ${propertyName}\n`;
    description += `Loyer mensuel: €${rentAmount.toFixed(2)}`;
    
    if (utilityCharges > 0) {
      description += `\nCharges d'utilitaires: €${utilityCharges.toFixed(2)}`;
    }
    
    description += `\nTotal: €${(rentAmount + utilityCharges).toFixed(2)}`;
    
    return description;
  }
  
  /**
   * Get French month names
   * @returns {Array} - Array of French month names
   */
  static getFrenchMonthNames() {
    return [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
  }
  
  /**
   * Get French status translations
   * @returns {Object} - Status translations
   */
  static getStatusTranslations() {
    return {
      'PENDING': 'En attente',
      'PAID': 'Payé',
      'OVERDUE': 'En retard',
      'RECEIPT_SENT': 'Reçu envoyé'
    };
  }
}

module.exports = FrenchBillTemplate;
