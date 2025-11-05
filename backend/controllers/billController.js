const { Bill, Tenant, Property, Receipt, Admin, Profit } = require('../models');
const { Op } = require('sequelize');
const PDFService = require('../services/pdfService');
const EmailService = require('../services/emailService');
const BillGenerationService = require('../services/billGenerationService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get all bills for an admin
 */
const getAllBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    // Build where clause based on admin role
    const whereClause = {};
    
    // ALL admins (including SUPER_ADMIN) only see their own bills
    // This ensures complete data isolation between admins
    whereClause.admin_id = req.admin.id;
    
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;
    const order = [[sortBy, sortOrder.toUpperCase()]];

    const bills = await Bill.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country']
        },
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        bills: bills.rows,
        pagination: {
          total: bills.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(bills.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

/**
 * Get a specific bill by ID
 */
const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findOne({
      where: { id },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone', 'join_date']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'monthly_rent']
        },
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Receipt,
          as: 'receipts',
          attributes: ['id', 'sent_date', 'status', 'sent_to_tenant', 'sent_to_admin']
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (bill.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bills.'
      });
    }

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

/**
 * Create a new bill manually
 */
const createBill = async (req, res) => {
  try {
    const { tenant_id, property_id, amount, rent_amount, charges, month, due_date, description } = req.body;

    // Validate required fields
    if (!tenant_id || !property_id || !amount || !month || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tenant_id, property_id, amount, month, due_date'
      });
    }

    // Check if tenant belongs to admin (ALL admins including SUPER_ADMIN)
    const tenantWhereClause = { 
      id: tenant_id,
      admin_id: req.admin.id 
    };
    
    const tenant = await Tenant.findOne({
      where: tenantWhereClause,
      include: [{
        model: Property,
        as: 'property',
        attributes: ['id', 'monthly_rent']
      }]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or not authorized'
      });
    }

    // Check if property belongs to admin (ALL admins including SUPER_ADMIN)
    const propertyWhereClause = { 
      id: property_id,
      admin_id: req.admin.id 
    };
    
    const property = await Property.findOne({
      where: propertyWhereClause
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not authorized'
      });
    }

    // Check if bill already exists for this tenant and month (ALL admins including SUPER_ADMIN)
    const existingBillWhereClause = { 
      tenant_id, 
      month,
      admin_id: req.admin.id 
    };
    
    const existingBill = await Bill.findOne({
      where: existingBillWhereClause
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: 'Bill already exists for this tenant and month'
      });
    }

    // Calculate rent_amount, charges, and total_amount
    const rentAmount = rent_amount ? parseFloat(rent_amount) : (tenant.property?.monthly_rent ? parseFloat(tenant.property.monthly_rent) : parseFloat(amount));
    const chargesAmount = charges ? parseFloat(charges) : 0;
    const totalAmount = rentAmount + chargesAmount;

    const bill = await Bill.create({
      tenant_id,
      property_id,
      admin_id: req.admin.id,
      amount: parseFloat(amount),
      rent_amount: rentAmount,
      charges: chargesAmount,
      total_amount: totalAmount,
      month,
      due_date,
      bill_date: new Date().toISOString().split('T')[0], // Set bill_date to today
      description: description || 'Monthly rent payment'
    });

    // Fetch the created bill with associations
    const createdBill = await Bill.findByPk(bill.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: createdBill
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
};

/**
 * Update a bill
 */
const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, due_date, status, description } = req.body;

    // ALL admins (including SUPER_ADMIN) only see their own bills
    const whereClause = { 
      id,
      admin_id: req.admin.id 
    };

    const bill = await Bill.findOne({
      where: whereClause
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Update fields
    if (amount !== undefined) bill.amount = parseFloat(amount);
    if (due_date !== undefined) bill.due_date = due_date;
    if (status !== undefined) bill.status = status;
    if (description !== undefined) bill.description = description;

    await bill.save();

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: error.message
    });
  }
};

/**
 * Delete a bill
 */
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    // ALL admins (including SUPER_ADMIN) only see their own bills
    const whereClause = { 
      id,
      admin_id: req.admin.id 
    };

    const bill = await Bill.findOne({
      where: whereClause
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    await bill.destroy();

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill',
      error: error.message
    });
  }
};


/**
 * Get receipt history for a bill
 */
const getReceiptHistory = async (req, res) => {
  try {
    const { admin_id } = req.user;
    const { id } = req.params;

    const receipts = await Receipt.findAll({
      where: { bill_id: id, admin_id },
      order: [['sent_date', 'DESC']]
    });

    res.json({
      success: true,
      data: receipts
    });
  } catch (error) {
    console.error('Error fetching receipt history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receipt history',
      error: error.message
    });
  }
};

/**
 * Get bills statistics
 */
const getBillsStats = async (req, res) => {
  try {
    const admin_id = req.admin?.id;
    
    if (!admin_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch all bills for manual calculation to handle both amount and total_amount
    const allBills = await Bill.findAll({
      where: { admin_id },
      attributes: ['id', 'status', 'amount', 'total_amount', 'due_date'],
      raw: true
    });

    // Calculate stats manually to handle both amount and total_amount
    const statusBreakdown = {};
    let totalBills = 0;
    let totalAmount = 0;
    let pendingBills = 0;
    let overdueBills = 0;
    const today = new Date();

    allBills.forEach(bill => {
      const billAmount = bill.total_amount || bill.amount || 0;
      totalBills++;
      totalAmount += parseFloat(billAmount);

      // Initialize status in breakdown if not exists
      if (!statusBreakdown[bill.status]) {
        statusBreakdown[bill.status] = {
          status: bill.status,
          count: 0,
          total_amount: 0
        };
      }

      statusBreakdown[bill.status].count++;
      statusBreakdown[bill.status].total_amount += parseFloat(billAmount);

      // Count pending and overdue
      if (bill.status === 'PENDING') {
        pendingBills++;
        
        // Check if overdue
        const dueDate = new Date(bill.due_date);
        if (dueDate < today) {
          overdueBills++;
        }
      } else if (bill.status === 'OVERDUE') {
        overdueBills++;
      }
    });

    // Convert statusBreakdown object to array
    const stats = Object.values(statusBreakdown);

    res.json({
      success: true,
      data: {
        totalBills,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        pendingBills,
        overdueBills,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching bills stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills statistics',
      error: error.message
    });
  }
};

/**
 * Download bill as PDF
 */
const downloadBill = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the bill with all related data (ALL admins including SUPER_ADMIN)
    const whereClause = { 
      id,
      admin_id: req.admin.id 
    };
    
    const bill = await Bill.findOne({
      where: whereClause,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'monthly_rent']
        },
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Generate and persist PDF to disk, then stream exact file bytes
    const pdfPath = await PDFService.generateBillPDF(bill);
    if (!bill.pdf_path || bill.pdf_path !== pdfPath) {
      await bill.update({ pdf_path: pdfPath });
    }
    const fsLocal = require('fs');
    // Add robust headers to help browser viewers
    try {
      const stat = fsLocal.statSync(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="facture-${bill.id}-${bill.month}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } catch (statErr) {
      console.warn('Could not stat PDF before streaming:', statErr.message);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="facture-${bill.id}-${bill.month}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    const readStream = fsLocal.createReadStream(pdfPath);
    readStream.on('error', (err) => {
      console.error('Error reading PDF file:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error reading bill PDF' });
      } else {
        try { res.end(); } catch (_) {}
      }
    });
    
    readStream.pipe(res);

  } catch (error) {
    console.error('Error downloading bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download bill',
      error: error.message
    });
  }
};

/**
 * Manually trigger monthly bill generation
 */
const generateMonthlyBills = async (req, res) => {
  try {
    const { month } = req.body;
    
    console.log(`🔄 Manual bill generation triggered by admin ${req.admin.id} for month: ${month || 'current'}`);
    
    const result = await BillGenerationService.generateMonthlyBills(month);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.statistics
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in manual bill generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly bills',
      error: error.message
    });
  }
};

/**
 * Get bill generation statistics for a specific month
 */
const getBillGenerationStats = async (req, res) => {
  try {
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month parameter is required (YYYY-MM format)'
      });
    }
    
    const result = await BillGenerationService.getBillGenerationStats(month);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error getting bill generation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bill generation statistics',
      error: error.message
    });
  }
};

/**
 * Generate bills for current admin only
 */
const generateBillsForCurrentAdmin = async (req, res) => {
  try {
    const { month } = req.body;
    
    console.log(`🔄 Bill generation for admin ${req.admin.id} triggered for month: ${month || 'current'}`);
    
    const result = await BillGenerationService.generateBillsForAdmin(req.admin.id, month);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.statistics
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating bills for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bills for admin',
      error: error.message
    });
  }
};

/**
 * Generate bills for a specific admin (Super Admin only)
 */
const generateBillsForAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { month } = req.body;
    
    console.log(`🔄 Bill generation for admin ${adminId} triggered by Super Admin ${req.admin.id} for month: ${month || 'current'}`);
    
    const result = await BillGenerationService.generateBillsForAdmin(adminId, month);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        statistics: result.statistics
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating bills for specific admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bills for specific admin',
      error: error.message
    });
  }
};

/**
 * Generate bills based on tenant joining dates
 */
const generateBillsBasedOnJoiningDate = async (req, res) => {
  try {
    const { month } = req.body;
    
    console.log(`🔄 Bill generation based on joining dates triggered by admin ${req.admin.id} for month: ${month || 'current'}`);
    
    const result = await BillGenerationService.generateBillsBasedOnJoiningDate(month);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        statistics: result.statistics
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error generating bills based on joining date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bills based on joining date',
      error: error.message
    });
  }
};

/**
 * Mark a bill as paid and update profit
 */
const markBillAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the bill with all associations (ALL admins including SUPER_ADMIN)
    const whereClause = { 
      id,
      admin_id: req.admin.id 
    };
    
    const bill = await Bill.findOne({
      where: whereClause,
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
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Check if bill is already paid
    if (bill.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture est déjà marquée comme payée'
      });
    }

    // Get the total amount to add to profit (use total_amount first, fallback to amount)
    const amountToAdd = parseFloat(bill.total_amount || bill.amount || 0);

    if (amountToAdd <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant de la facture doit être supérieur à 0'
      });
    }

    // Update bill status and payment date
    bill.status = 'PAID';
    bill.payment_date = new Date();
    await bill.save();

    // ✅ IMPORTANT: Add to profit for the ADMIN who owns the bill, not the requesting admin
    // This ensures SUPER_ADMIN marking bills doesn't add to their own profit
    const profitAdminId = bill.admin_id;
    const updatedProfit = await Profit.incrementProfit(profitAdminId, amountToAdd);

    console.log(`✅ Bill #${bill.id} marked as PAID - €${amountToAdd} added to Admin #${profitAdminId} profit`);
    console.log(`   New total profit: €${updatedProfit.total_profit}`);

    // Get updated profit total
    const totalProfit = await Profit.getTotalProfit(req.admin.id);

    console.log(`✅ Bill ${id} marked as paid. Added €${amountToAdd.toFixed(2)} to profit. New total: €${totalProfit.toFixed(2)}`);

    res.json({
      success: true,
      message: 'Facture marquée comme payée avec succès',
      data: {
        bill: {
          id: bill.id,
          status: bill.status,
          payment_date: bill.payment_date,
          amount: amountToAdd
        },
        profit: {
          total: totalProfit,
          added: amountToAdd
        }
      }
    });

  } catch (error) {
    console.error('Error marking bill as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la mise à jour de la facture',
      error: error.message
    });
  }
};

/**
 * Undo payment - Revert a paid bill back to pending
 */
const undoPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the bill with all associations (ALL admins including SUPER_ADMIN)
    const whereClause = { 
      id,
      admin_id: req.admin.id 
    };
    
    const bill = await Bill.findOne({
      where: whereClause,
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
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Check if bill is not paid
    if (bill.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture n\'est pas marquée comme payée'
      });
    }

    // Get the total amount to subtract from profit
    const amountToSubtract = parseFloat(bill.total_amount || bill.amount || 0);

    if (amountToSubtract <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant de la facture doit être supérieur à 0'
      });
    }

    // Update bill status and remove payment date
    bill.status = 'PENDING';
    bill.payment_date = null;
    await bill.save();

    // ✅ IMPORTANT: Subtract from profit for the ADMIN who owns the bill
    // This ensures consistency with the markAsPaid function
    const profitAdminId = bill.admin_id;
    const updatedProfit = await Profit.incrementProfit(profitAdminId, -amountToSubtract);

    console.log(`❌ Bill #${bill.id} payment UNDONE - €${amountToSubtract} removed from Admin #${profitAdminId} profit`);
    console.log(`   New total profit: €${updatedProfit.total_profit}`);

    // Get updated profit total for the requesting admin
    const totalProfit = await Profit.getTotalProfit(profitAdminId);

    res.json({
      success: true,
      message: 'Paiement annulé avec succès',
      data: {
        bill: {
          id: bill.id,
          status: bill.status,
          payment_date: bill.payment_date,
          amount: amountToSubtract
        },
        profit: {
          total: totalProfit,
          subtracted: amountToSubtract
        }
      }
    });

  } catch (error) {
    console.error('Error undoing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de l\'annulation du paiement',
      error: error.message
    });
  }
};

/**
 * Get total profit for admin
 */
const getTotalProfit = async (req, res) => {
  try {
    const totalProfit = await Profit.getTotalProfit(req.admin.id);
    
    res.json({
      success: true,
      data: {
        total_profit: totalProfit
      }
    });
  } catch (error) {
    console.error('Error fetching total profit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total profit',
      error: error.message
    });
  }
};

/**
 * @desc    Get bill scheduler status
 * @route   GET /api/bills/scheduler/status
 * @access  Private
 */
const getSchedulerStatus = async (req, res) => {
  try {
    const billScheduler = require('../services/billScheduler');
    const status = billScheduler.getStatus();
    
    // Calculate next run date (1st of next month at 9:00 AM UTC)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
    
    res.json({
      success: true,
      data: {
        isRunning: status.isRunning,
        status: status.status,
        isEnabled: true, // Always enabled since scheduler is started
        nextRun: nextMonth.toISOString(),
        lastRun: null // Could be stored in database if needed
      }
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
};

/**
 * @desc    Get tenants data for bill creation (accessible by all admins)
 * @route   GET /api/bills/create-data/tenants
 * @access  Private
 */
const getTenantsForBillCreation = async (req, res) => {
  try {
    const { Tenant, Property, Admin } = require('../models');
    
    // Build where clause based on admin role
    const whereClause = {};
    
    // ALL admins (including SUPER_ADMIN) only see their own tenants
    // This ensures complete data isolation between admins
    whereClause.admin_id = req.admin.id;
    
    // Only get active tenants for bill creation
    whereClause.status = 'ACTIVE';
    
    const tenants = await Tenant.findAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'monthly_rent'],
          required: false // LEFT JOIN to include tenants without properties
        },
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: ['id', 'name', 'email', 'phone', 'admin_id', 'property_id', 'status', 'rent_amount']
    });
    
    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Error getting tenants for bill creation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenants for bill creation',
      error: error.message
    });
  }
};

/**
 * @desc    Get properties data for bill creation (accessible by all admins)
 * @route   GET /api/bills/create-data/properties
 * @access  Private
 */
const getPropertiesForBillCreation = async (req, res) => {
  try {
    const { Property, Admin } = require('../models');
    
    // Build where clause based on admin role
    const whereClause = {};
    
    // ALL admins (including SUPER_ADMIN) only see their own properties
    // This ensures complete data isolation between admins
    whereClause.admin_id = req.admin.id;
    
    const properties = await Property.findAll({
      where: whereClause,
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: ['id', 'title', 'address', 'city', 'country', 'monthly_rent', 'admin_id', 'property_type']
    });
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('Error getting properties for bill creation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties for bill creation',
      error: error.message
    });
  }
};

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  getReceiptHistory,
  getBillsStats,
  downloadBill,
  generateMonthlyBills,
  generateBillsBasedOnJoiningDate,
  getBillGenerationStats,
  generateBillsForCurrentAdmin,
  generateBillsForAdmin,
  getSchedulerStatus,
  getTenantsForBillCreation,
  getPropertiesForBillCreation,
  markBillAsPaid,
  undoPayment,
  getTotalProfit
};
