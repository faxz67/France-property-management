const cron = require('node-cron');
const { Bill, Tenant, Property, Admin } = require('../models');
const { Op } = require('sequelize');
const EmailService = require('./emailService');
const BillGenerationService = require('./billGenerationService');

class BillScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the bill generation scheduler
   * Runs on the 1st of every month at 9:00 AM
   */
  start() {
    console.log('🕒 Starting bill generation scheduler...');
    console.log('📅 Bills will be generated automatically on the 1st of each month at 9:00 AM UTC');
    
    // Run on the 1st of every month at 9:00 AM
    cron.schedule('0 9 1 * *', async () => {
      console.log('📆 It\'s the 1st of the month - Generating bills for all active tenants...');
      await this.generateAllMonthlyBills();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Also check daily at 9:00 AM for any missed bills (backup)
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running daily bill check for missed bills...');
      await this.checkForMissedBills();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Check for overdue bills daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('⏰ Checking for overdue bills...');
      await this.checkOverdueBills();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Run on startup for any missed bills (with delay to let server initialize)
    setTimeout(async () => {
      console.log('🚀 Running initial bill generation check on startup...');
      await this.checkForMissedBills();
    }, 10000); // 10 seconds delay
  }

  /**
   * Generate monthly bills for ALL active tenants
   * This is called on the 1st of each month
   */
  async generateAllMonthlyBills() {
    if (this.isRunning) {
      console.log('⚠️ Bill generation already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📅 Generating bills for all active tenants...');

    try {
      // Use the improved BillGenerationService which includes rent_amount, charges, total_amount
      const result = await BillGenerationService.generateMonthlyBills();
      
      if (result.success) {
        console.log('✅ Monthly bill generation completed successfully!');
        console.log(`📊 Statistics:`, result.statistics);
        
        // Send success notification to admins
        await this.sendSuccessNotification(result.statistics);
      } else {
        console.error('❌ Bill generation failed:', result.message);
        await this.sendErrorNotification(0, 1);
      }

    } catch (error) {
      console.error('❌ Error in bill generation process:', error);
      await this.sendErrorNotification(0, 1);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check for any missed bills (backup system)
   */
  async checkForMissedBills() {
    if (this.isRunning) {
      console.log('⚠️ Bill generation already in progress, skipping missed bills check...');
      return;
    }

    console.log('🔍 Checking for missed bills...');

    try {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM format
      
      // Find all active tenants
      const activeTenants = await Tenant.findAll({
        where: {
          status: 'ACTIVE'
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'monthly_rent']
          }
        ]
      });

      let missedBills = 0;

      for (const tenant of activeTenants) {
        // Check if bill exists for current month
        const existingBill = await Bill.findOne({
          where: {
            tenant_id: tenant.id,
            month: currentMonth
          }
        });

        if (!existingBill && tenant.property && tenant.property.monthly_rent) {
          missedBills++;
        }
      }

      if (missedBills > 0) {
        console.log(`⚠️ Found ${missedBills} tenants without bills for ${currentMonth}`);
        console.log('🔄 Triggering bill generation directly...');
        // Call BillGenerationService directly instead of generateAllMonthlyBills to avoid flag conflict
        const result = await BillGenerationService.generateMonthlyBills(currentMonth);
        if (result.success) {
          console.log('✅ Missed bills generated successfully!');
          console.log(`📊 Statistics:`, result.statistics);
        } else {
          console.error('❌ Failed to generate missed bills:', result.message);
        }
      } else {
        console.log(`✅ All tenants have bills for ${currentMonth}`);
      }

    } catch (error) {
      console.error('❌ Error checking for missed bills:', error);
    }
  }

  /**
   * Send success notification to admins
   */
  async sendSuccessNotification(statistics) {
    try {
      const admins = await Admin.findAll({
        attributes: ['email', 'name']
      });

      const message = `
        <h3>✅ Génération de Factures Réussie</h3>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Mois:</strong> ${statistics.month}</p>
        <p><strong>Factures générées:</strong> ${statistics.billsGenerated}</p>
        <p><strong>Locataires actifs:</strong> ${statistics.totalTenants}</p>
        <p><strong>Factures ignorées (déjà existantes):</strong> ${statistics.billsSkipped}</p>
        <p><strong>Erreurs:</strong> ${statistics.errors}</p>
        ${statistics.errors > 0 ? '<p style="color: red;">⚠️ Des erreurs se sont produites. Vérifiez les logs du serveur.</p>' : ''}
      `;

      for (const admin of admins) {
        if (admin.email) {
          await EmailService.sendNotificationEmail({
            to: admin.email,
            subject: `✅ Factures Générées - ${statistics.month}`,
            message: message,
            type: statistics.errors > 0 ? 'warning' : 'success'
          });
        }
      }
    } catch (error) {
      console.error('Error sending success notification:', error);
    }
  }

  /**
   * Send error notification to admins
   * @param {Number} billsGenerated - Number of bills generated
   * @param {Number} errors - Number of errors
   */
  async sendErrorNotification(billsGenerated, errors) {
    try {
      const admins = await Admin.findAll({
        attributes: ['email', 'name']
      });

      const message = `
        <h3>⚠️ Rapport de Génération de Factures</h3>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Factures générées:</strong> ${billsGenerated}</p>
        <p><strong>Erreurs:</strong> ${errors}</p>
        <p style="color: red;">⚠️ Des erreurs se sont produites. Veuillez vérifier les logs du serveur pour plus de détails.</p>
      `;

      for (const admin of admins) {
        if (admin.email) {
          await EmailService.sendNotificationEmail({
            to: admin.email,
            subject: '⚠️ Génération de Factures - Erreurs Détectées',
            message: message,
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error sending error notification:', error);
    }
  }

  /**
   * Manually trigger bill generation (for testing or admin use)
   */
  async triggerBillGeneration() {
    console.log('🔧 Manually triggering bill generation...');
    await this.generateAllMonthlyBills();
  }

  /**
   * Reset the running flag (for emergency situations)
   */
  resetRunningFlag() {
    console.log('🔄 Resetting bill generation flag...');
    this.isRunning = false;
    console.log('✅ Bill generation flag reset');
  }

  /**
   * Get current status of the scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      status: this.isRunning ? 'GENERATING' : 'IDLE'
    };
  }

  /**
   * Check for overdue bills and update their status
   */
  async checkOverdueBills() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      const overdueBills = await Bill.findAll({
        where: {
          status: 'PENDING',
          due_date: {
            [Op.lt]: today
          }
        },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['name', 'email']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['title']
          }
        ]
      });

      for (const bill of overdueBills) {
        await bill.markAsOverdue();
        console.log(`⚠️ Marked bill ${bill.id} as overdue for tenant ${bill.tenant.name}`);
      }

      if (overdueBills.length > 0) {
        console.log(`📋 Updated ${overdueBills.length} bills to overdue status`);
      }
    } catch (error) {
      console.error('Error checking overdue bills:', error);
    }
  }
}

module.exports = new BillScheduler();
