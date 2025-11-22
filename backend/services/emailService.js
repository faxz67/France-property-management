// Email service disabled: no external SMTP used
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null; // disabled
  }

  /**
   * Send receipt email to both tenant and admin
   * @param {Object} options - Email options
   */
  async sendReceiptEmail(options) {
    // Email disabled: act as no-op to keep flows working
    const { bill } = options || {};
    const recipients = bill ? [bill.tenant?.email, bill.admin?.email].filter(Boolean) : [];
    console.log('📧 Email sending skipped (service disabled). Recipients:', recipients);
    return { success: true, skipped: true, recipients };
  }

  /**
   * Send notification email
   * @param {Object} options - Email options
   */
  async sendNotificationEmail(options) {
    const { to, subject, message, type = 'info' } = options;

    // Email disabled: no-op
    console.log('📧 Notification email skipped (service disabled). To:', to, 'Subject:', subject);
    return { success: true, skipped: true };
  }

  /**
   * Generate receipt email HTML content
   * @param {Object} bill - Bill object
   * @returns {String} HTML content
   */
  generateReceiptEmailContent(bill) {
    const greeting = `Cher/Chère ${bill.tenant.name},`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quittance de Loyer</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 5px;
          }
          .bill-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #666;
          }
          .highlight {
            color: #007bff;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Système de Gestion Immobilière</h2>
          <p>Notification de Quittance de Loyer</p>
        </div>
        
        <div class="content">
          <p>${greeting}</p>
          
          <p>Veuillez trouver ci-joint la quittance de loyer pour le paiement suivant :</p>
          
          <div class="bill-details">
            <h3>Détails du reçu</h3>
            <table>
              <tr>
                <th>Numéro de reçu :</th>
                <td>#${bill.id}</td>
              </tr>
              <tr>
                <th>Mois :</th>
                <td>${bill.month}</td>
              </tr>
              <tr>
                <th>Date d'échéance :</th>
                <td>${new Date(bill.due_date).toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr>
                <th>Montant :</th>
                <td class="highlight">${parseFloat(bill.amount).toFixed(2)}€</td>
              </tr>
              <tr>
                <th>Statut :</th>
                <td>${bill.status}</td>
              </tr>
            </table>
            
            <h3>Informations de la propriété</h3>
            <table>
              <tr>
                <th>Propriété :</th>
                <td>${bill.property.title}</td>
              </tr>
              <tr>
                <th>Adresse :</th>
                <td>${bill.property.address}</td>
              </tr>
              <tr>
                <th>Ville :</th>
                <td>${bill.property.city}</td>
              </tr>
            </table>
            
            <h3>Informations du locataire</h3>
            <table>
              <tr>
                <th>Nom :</th>
                <td>${bill.tenant.name}</td>
              </tr>
              <tr>
                <th>Email :</th>
                <td>${bill.tenant.email || 'N/A'}</td>
              </tr>
              <tr>
                <th>Téléphone :</th>
                <td>${bill.tenant.phone || 'N/A'}</td>
              </tr>
            </table>
            
            <h3>Informations de l'administrateur</h3>
            <table>
              <tr>
                <th>Nom :</th>
                <td>${bill.admin.name}</td>
              </tr>
              <tr>
                <th>Email :</th>
                <td>${bill.admin.email || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <p>Veuillez conserver ce reçu pour vos archives. Si vous avez des questions, veuillez nous contacter.</p>
          
          <p>Merci pour votre confiance !</p>
        </div>
        
        <div class="footer">
          <p>Ceci est un message automatique du Système de Gestion Immobilière.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate notification email HTML content
   * @param {String} message - Message content
   * @param {String} type - Message type (info, warning, error, success)
   * @returns {String} HTML content
   */
  generateNotificationEmailContent(message, type) {
    const colors = {
      info: '#007bff',
      warning: '#ffc107',
      error: '#dc3545',
      success: '#28a745'
    };

    const color = colors[type] || colors.info;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notification Système</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            border-left: 4px solid ${color};
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Système de Gestion Immobilière</h2>
          <p>System Notification</p>
        </div>
        
        <div class="content">
          <p>${message}</p>
        </div>
        
        <div class="footer">
          <p>Ceci est un message automatique du Système de Gestion Immobilière.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
