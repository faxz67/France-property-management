const { Bill, Tenant, Property, Admin } = require('../models');
const { Op } = require('sequelize');
const FrenchBillTemplate = require('./frenchBillTemplate');

/**
 * Monthly Bill Generation Service
 * Generates bills for all active tenants on the 1st of every month
 */
class BillGenerationService {
  
  /**
   * Generate bills for all active tenants for a specific month
   * @param {string} month - Month in YYYY-MM format (optional, defaults to current month)
   * @returns {Object} - Generation result with statistics
   */
  static async generateMonthlyBills(month = null) {
    try {
      // Determine the target month
      const targetDate = month ? new Date(month + '-01') : new Date();
      const currentMonth = targetDate.toISOString().slice(0, 7); // YYYY-MM format
      const billDate = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD format
      
      // Calculate due date (15th of the month)
      const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 15);
      const dueDateString = dueDate.toISOString().slice(0, 10);

      console.log(`🔄 Starting monthly bill generation for ${currentMonth}...`);

      // Find all active tenants with their properties and admin info
      // Only include tenants who joined before or during the target month
      const activeTenants = await Tenant.findAll({
        where: {
          status: 'ACTIVE',
          join_date: {
            [Op.lte]: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0) // End of target month
          }
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title', 'address', 'city', 'monthly_rent', 'admin_id'],
            include: [
              {
                model: Admin,
                as: 'admin',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ]
      });

      if (activeTenants.length === 0) {
        console.log('ℹ️  No active tenants found for bill generation');
        return {
          success: true,
          message: 'No active tenants found',
          statistics: {
            totalTenants: 0,
            billsGenerated: 0,
            billsSkipped: 0,
            errors: 0
          }
        };
      }

      let billsGenerated = 0;
      let billsSkipped = 0;
      let errors = 0;
      const errorDetails = [];

      // Process each tenant
      for (const tenant of activeTenants) {
        try {
          // Check if bill already exists for this tenant and month
          const existingBill = await Bill.findOne({
            where: {
              tenant_id: tenant.id,
              month: currentMonth,
              admin_id: tenant.property.admin_id
            }
          });

          if (existingBill) {
            console.log(`⏭️  Bill already exists for tenant ${tenant.name} (${tenant.email}) for ${currentMonth}`);
            billsSkipped++;
            continue;
          }

          // Calculate total amount (rent + utility charges if applicable)
          const rentAmount = parseFloat(tenant.property.monthly_rent) || 0;
          const utilityCharges = parseFloat(tenant.utility_charges) || 0;
          const totalAmount = rentAmount + utilityCharges;

          // Create the bill
          const bill = await Bill.create({
            tenant_id: tenant.id,
            property_id: tenant.property.id,
            admin_id: tenant.property.admin_id,
            amount: totalAmount,
            rent_amount: rentAmount,
            charges: utilityCharges,
            total_amount: totalAmount,
            month: currentMonth,
            bill_date: billDate,
            due_date: dueDateString,
            status: 'PENDING',
            language: 'fr',
            description: FrenchBillTemplate.generateDescription(tenant, rentAmount, utilityCharges)
          });

          console.log(`✅ Generated bill for tenant ${tenant.name} (${tenant.email}) - Amount: €${totalAmount.toFixed(2)}`);
          billsGenerated++;

        } catch (error) {
          console.error(`❌ Error generating bill for tenant ${tenant.name} (${tenant.email}):`, error.message);
          errors++;
          errorDetails.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantEmail: tenant.email,
            error: error.message
          });
        }
      }

      const result = {
        success: true,
        message: `Monthly bill generation completed for ${currentMonth}`,
        statistics: {
          totalTenants: activeTenants.length,
          billsGenerated,
          billsSkipped,
          errors,
          month: currentMonth,
          billDate,
          dueDate: dueDateString
        }
      };

      if (errorDetails.length > 0) {
        result.errorDetails = errorDetails;
      }

      console.log(`📊 Bill generation summary:`, result.statistics);
      return result;

    } catch (error) {
      console.error('❌ Error in monthly bill generation:', error);
      return {
        success: false,
        message: 'Failed to generate monthly bills',
        error: error.message
      };
    }
  }


  /**
   * Generate bills for tenants based on their joining date
   * This method generates bills starting from the month they joined
   * @param {string} month - Month in YYYY-MM format (optional, defaults to current month)
   * @returns {Object} - Generation result with statistics
   */
  static async generateBillsBasedOnJoiningDate(month = null) {
    try {
      const targetDate = month ? new Date(month + '-01') : new Date();
      const currentMonth = targetDate.toISOString().slice(0, 7);
      const billDate = targetDate.toISOString().slice(0, 10);
      
      // Calculate due date (15th of the month)
      const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 15);
      const dueDateString = dueDate.toISOString().slice(0, 10);

      console.log(`🔄 Starting bill generation based on joining dates for ${currentMonth}...`);

      // Find all active tenants
      const activeTenants = await Tenant.findAll({
        where: {
          status: 'ACTIVE'
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title', 'address', 'city', 'monthly_rent', 'admin_id'],
            include: [
              {
                model: Admin,
                as: 'admin',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ]
      });

      if (activeTenants.length === 0) {
        console.log('ℹ️  No active tenants found for bill generation');
        return {
          success: true,
          message: 'No active tenants found',
          statistics: {
            totalTenants: 0,
            billsGenerated: 0,
            billsSkipped: 0,
            errors: 0
          }
        };
      }

      let billsGenerated = 0;
      let billsSkipped = 0;
      let errors = 0;
      const errorDetails = [];

      // Process each tenant
      for (const tenant of activeTenants) {
        try {
          // Check if tenant joined before or during the target month
          const joinDate = new Date(tenant.join_date);
          const joinMonth = joinDate.toISOString().slice(0, 7);
          
          if (joinMonth > currentMonth) {
            console.log(`⏭️  Tenant ${tenant.name} joined in ${joinMonth}, skipping ${currentMonth}`);
            continue;
          }

          // Check if bill already exists for this tenant and month
          const existingBill = await Bill.findOne({
            where: {
              tenant_id: tenant.id,
              month: currentMonth,
              admin_id: tenant.property.admin_id
            }
          });

          if (existingBill) {
            console.log(`⏭️  Bill already exists for tenant ${tenant.name} (${tenant.email}) for ${currentMonth}`);
            billsSkipped++;
            continue;
          }

          // Calculate total amount (rent + utility charges if applicable)
          const rentAmount = parseFloat(tenant.property.monthly_rent) || 0;
          const utilityCharges = parseFloat(tenant.utility_charges) || 0;
          const totalAmount = rentAmount + utilityCharges;

          // Create the bill
          const bill = await Bill.create({
            tenant_id: tenant.id,
            property_id: tenant.property.id,
            admin_id: tenant.property.admin_id,
            amount: totalAmount,
            rent_amount: rentAmount,
            charges: utilityCharges,
            total_amount: totalAmount,
            month: currentMonth,
            bill_date: billDate,
            due_date: dueDateString,
            status: 'PENDING',
            language: 'fr',
            description: FrenchBillTemplate.generateDescription(tenant, rentAmount, utilityCharges)
          });

          console.log(`✅ Generated bill for tenant ${tenant.name} (joined: ${joinMonth}) - Amount: €${totalAmount.toFixed(2)}`);
          billsGenerated++;

        } catch (error) {
          console.error(`❌ Error generating bill for tenant ${tenant.name} (${tenant.email}):`, error.message);
          errors++;
          errorDetails.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantEmail: tenant.email,
            error: error.message
          });
        }
      }

      const result = {
        success: true,
        message: `Bill generation based on joining dates completed for ${currentMonth}`,
        statistics: {
          totalTenants: activeTenants.length,
          billsGenerated,
          billsSkipped,
          errors,
          month: currentMonth,
          billDate,
          dueDate: dueDateString
        }
      };

      if (errorDetails.length > 0) {
        result.errorDetails = errorDetails;
      }

      console.log(`📊 Bill generation summary:`, result.statistics);
      return result;

    } catch (error) {
      console.error('❌ Error in bill generation based on joining dates:', error);
      return {
        success: false,
        message: 'Failed to generate bills based on joining dates',
        error: error.message
      };
    }
  }

  /**
   * Generate bills for a specific admin
   * @param {number} adminId - Admin ID
   * @param {string} month - Month in YYYY-MM format
   * @returns {Object} - Generation result
   */
  static async generateBillsForAdmin(adminId, month = null) {
    try {
      const targetDate = month ? new Date(month + '-01') : new Date();
      const currentMonth = targetDate.toISOString().slice(0, 7);
      const billDate = targetDate.toISOString().slice(0, 10);
      const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 15);
      const dueDateString = dueDate.toISOString().slice(0, 10);

      // Find active tenants for this admin
      const activeTenants = await Tenant.findAll({
        where: {
          status: 'ACTIVE',
          admin_id: adminId
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title', 'address', 'city', 'monthly_rent', 'admin_id']
          }
        ]
      });

      let billsGenerated = 0;
      let billsSkipped = 0;

      for (const tenant of activeTenants) {
        // Check if bill already exists
        const existingBill = await Bill.findOne({
          where: {
            tenant_id: tenant.id,
            month: currentMonth,
            admin_id: adminId
          }
        });

        if (existingBill) {
          billsSkipped++;
          continue;
        }

        // Create bill
        const rentAmount = parseFloat(tenant.property.monthly_rent) || 0;
        const utilityCharges = parseFloat(tenant.utility_charges) || 0;
        const totalAmount = rentAmount + utilityCharges;

        await Bill.create({
          tenant_id: tenant.id,
          property_id: tenant.property.id,
          admin_id: adminId,
          amount: totalAmount,
          rent_amount: rentAmount,
          charges: utilityCharges,
          total_amount: totalAmount,
          month: currentMonth,
          bill_date: billDate,
          due_date: dueDateString,
          status: 'PENDING',
          language: 'fr',
          description: FrenchBillTemplate.generateDescription(tenant, rentAmount, utilityCharges)
        });

        billsGenerated++;
      }

      return {
        success: true,
        message: `Generated bills for admin ${adminId} for ${currentMonth}`,
        statistics: {
          totalTenants: activeTenants.length,
          billsGenerated,
          billsSkipped,
          month: currentMonth
        }
      };

    } catch (error) {
      console.error('Error generating bills for admin:', error);
      return {
        success: false,
        message: 'Failed to generate bills for admin',
        error: error.message
      };
    }
  }

  /**
   * Get bill generation statistics for a specific month
   * @param {string} month - Month in YYYY-MM format
   * @returns {Object} - Statistics
   */
  static async getBillGenerationStats(month) {
    try {
      const bills = await Bill.findAll({
        where: { month },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title']
          },
          {
            model: Admin,
            as: 'admin',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      const stats = {
        month,
        totalBills: bills.length,
        totalAmount: bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0),
        statusBreakdown: {},
        adminBreakdown: {}
      };

      // Status breakdown
      bills.forEach(bill => {
        stats.statusBreakdown[bill.status] = (stats.statusBreakdown[bill.status] || 0) + 1;
      });

      // Admin breakdown
      bills.forEach(bill => {
        const adminName = bill.admin.name;
        if (!stats.adminBreakdown[adminName]) {
          stats.adminBreakdown[adminName] = {
            bills: 0,
            amount: 0
          };
        }
        stats.adminBreakdown[adminName].bills++;
        stats.adminBreakdown[adminName].amount += parseFloat(bill.amount);
      });

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('Error getting bill generation stats:', error);
      return {
        success: false,
        message: 'Failed to get bill generation statistics',
        error: error.message
      };
    }
  }
}

module.exports = BillGenerationService;
