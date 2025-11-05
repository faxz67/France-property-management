const cron = require('node-cron');
const BillGenerationService = require('./billGenerationService');

/**
 * Cron Service for scheduling automated tasks
 */
class CronService {
  
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all cron jobs
   */
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️  Cron service already initialized');
      return;
    }

    console.log('🕐 Initializing cron jobs...');

    // Monthly bill generation - runs on the 1st of every month at 9:00 AM
    this.scheduleMonthlyBillGeneration();

    // Overdue bill check - runs daily at 10:00 AM
    this.scheduleOverdueBillCheck();

    this.isInitialized = true;
    console.log('✅ Cron service initialized successfully');
  }

  /**
   * Schedule monthly bill generation
   * Runs on the 1st of every month at 9:00 AM
   */
  scheduleMonthlyBillGeneration() {
    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('🔄 Starting scheduled monthly bill generation...');
      
      try {
        const result = await BillGenerationService.generateMonthlyBills();
        
        if (result.success) {
          console.log('✅ Monthly bill generation completed successfully');
          console.log('📊 Statistics:', result.statistics);
        } else {
          console.error('❌ Monthly bill generation failed:', result.message);
        }
      } catch (error) {
        console.error('❌ Error in scheduled monthly bill generation:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris' // French timezone
    });

    this.jobs.set('monthlyBillGeneration', job);
    console.log('📅 Scheduled monthly bill generation: 1st of every month at 9:00 AM (Europe/Paris)');
  }

  /**
   * Schedule overdue bill check
   * Runs daily at 10:00 AM to check for overdue bills
   */
  scheduleOverdueBillCheck() {
    const job = cron.schedule('0 10 * * *', async () => {
      console.log('🔄 Starting daily overdue bill check...');
      
      try {
        await this.checkOverdueBills();
        console.log('✅ Daily overdue bill check completed');
      } catch (error) {
        console.error('❌ Error in overdue bill check:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });

    this.jobs.set('overdueBillCheck', job);
    console.log('📅 Scheduled overdue bill check: Daily at 10:00 AM (Europe/Paris)');
  }

  /**
   * Check for overdue bills and update their status
   */
  async checkOverdueBills() {
    try {
      const { Bill } = require('../models');
      const { Op } = require('sequelize');
      
      const today = new Date().toISOString().slice(0, 10);
      
      // Find bills that are past due date and still pending
      const overdueBills = await Bill.findAll({
        where: {
          status: 'PENDING',
          due_date: {
            [Op.lt]: today
          }
        },
        include: [
          {
            model: require('../models').Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (overdueBills.length === 0) {
        console.log('ℹ️  No overdue bills found');
        return;
      }

      // Update status to OVERDUE
      for (const bill of overdueBills) {
        await bill.update({ status: 'OVERDUE' });
        console.log(`⚠️  Marked bill ${bill.id} as overdue for tenant ${bill.tenant.name}`);
      }

      console.log(`📊 Updated ${overdueBills.length} bills to overdue status`);

    } catch (error) {
      console.error('Error checking overdue bills:', error);
      throw error;
    }
  }

  /**
   * Manually trigger monthly bill generation
   * @param {string} month - Optional month in YYYY-MM format
   * @returns {Object} - Generation result
   */
  async triggerMonthlyBillGeneration(month = null) {
    console.log('🔄 Manually triggering monthly bill generation...');
    return await BillGenerationService.generateMonthlyBills(month);
  }

  /**
   * Get status of all cron jobs
   * @returns {Object} - Job statuses
   */
  getJobStatuses() {
    const statuses = {};
    
    for (const [name, job] of this.jobs) {
      statuses[name] = {
        running: job.running,
        scheduled: job.scheduled,
        lastDate: job.lastDate,
        nextDate: job.nextDate
      };
    }

    return {
      initialized: this.isInitialized,
      jobs: statuses
    };
  }

  /**
   * Start a specific job
   * @param {string} jobName - Name of the job to start
   */
  startJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      console.log(`▶️  Started cron job: ${jobName}`);
    } else {
      console.log(`❌ Job not found: ${jobName}`);
    }
  }

  /**
   * Stop a specific job
   * @param {string} jobName - Name of the job to stop
   */
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      console.log(`⏹️  Stopped cron job: ${jobName}`);
    } else {
      console.log(`❌ Job not found: ${jobName}`);
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    console.log('🛑 Stopping all cron jobs...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`⏹️  Stopped: ${name}`);
    }
    
    this.isInitialized = false;
    console.log('✅ All cron jobs stopped');
  }

  /**
   * Restart all cron jobs
   */
  restart() {
    console.log('🔄 Restarting cron service...');
    this.stopAll();
    this.initialize();
  }
}

// Create singleton instance
const cronService = new CronService();

module.exports = cronService;
