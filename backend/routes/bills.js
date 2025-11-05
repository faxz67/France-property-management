const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');
const { validateBill } = require('../middleware/validation');

/**
 * @route   GET /api/bills
 * @desc    Get all bills for authenticated admin
 * @access  Private
 */
router.get('/', verifyToken, billController.getAllBills);

/**
 * @route   GET /api/bills/stats
 * @desc    Get bills statistics for authenticated admin
 * @access  Private
 */
router.get('/stats', verifyToken, billController.getBillsStats);

/**
 * @route   GET /api/bills/:id
 * @desc    Get specific bill by ID
 * @access  Private
 */
router.get('/:id', verifyToken, billController.getBillById);

/**
 * @route   POST /api/bills
 * @desc    Create a new bill
 * @access  Private
 */
router.post('/', verifyToken, validateBill, billController.createBill);

/**
 * @route   PUT /api/bills/:id
 * @desc    Update a bill
 * @access  Private
 */
router.put('/:id', verifyToken, billController.updateBill);

/**
 * @route   DELETE /api/bills/:id
 * @desc    Delete a bill
 * @access  Private
 */
router.delete('/:id', verifyToken, billController.deleteBill);


/**
 * @route   GET /api/bills/:id/receipts
 * @desc    Get receipt history for a bill
 * @access  Private
 */
router.get('/:id/receipts', verifyToken, billController.getReceiptHistory);

/**
 * @route   GET /api/bills/:id/download
 * @desc    Download bill as PDF
 * @access  Private
 */
router.get('/:id/download', verifyToken, billController.downloadBill);

/**
 * @route   POST /api/bills/generate-monthly
 * @desc    Manually trigger monthly bill generation (SUPER_ADMIN only)
 * @access  Private (SUPER_ADMIN)
 */
router.post('/generate-monthly', verifyToken, isSuperAdmin, billController.generateMonthlyBills);

/**
 * @route   POST /api/bills/generate-admin
 * @desc    Generate bills for current admin only
 * @access  Private
 */
router.post('/generate-admin', verifyToken, billController.generateBillsForCurrentAdmin);

/**
 * @route   GET /api/bills/generation-stats/:month
 * @desc    Get bill generation statistics for a specific month
 * @access  Private
 */
router.get('/generation-stats/:month', verifyToken, billController.getBillGenerationStats);

/**
 * @route   GET /api/bills/scheduler/status
 * @desc    Get bill scheduler status
 * @access  Private
 */
router.get('/scheduler/status', verifyToken, billController.getSchedulerStatus);

/**
 * @route   GET /api/bills/create-data/tenants
 * @desc    Get tenants data for bill creation (accessible by all admins)
 * @access  Private
 */
router.get('/create-data/tenants', verifyToken, billController.getTenantsForBillCreation);

/**
 * @route   GET /api/bills/create-data/properties
 * @desc    Get properties data for bill creation (accessible by all admins)
 * @access  Private
 */
router.get('/create-data/properties', verifyToken, billController.getPropertiesForBillCreation);

/**
 * @route   PUT /api/bills/:id/pay
 * @desc    Mark a bill as paid and update profit
 * @access  Private
 */
router.put('/:id/pay', verifyToken, billController.markBillAsPaid);

/**
 * @route   PUT /api/bills/:id/undo
 * @desc    Undo payment - Revert a paid bill back to pending
 * @access  Private
 */
router.put('/:id/undo', verifyToken, billController.undoPayment);

/**
 * @route   POST /api/bills/generate-monthly
 * @desc    Manually generate monthly bills for all active tenants
 * @access  Private (Admin)
 */
router.post('/generate-monthly', verifyToken, billController.generateMonthlyBills);

/**
 * @route   POST /api/bills/generate-based-on-joining-date
 * @desc    Generate bills based on tenant joining dates
 * @access  Private (Admin)
 */
router.post('/generate-based-on-joining-date', verifyToken, billController.generateBillsBasedOnJoiningDate);

/**
 * @route   POST /api/bills/generate-for-admin/:adminId
 * @desc    Generate bills for a specific admin
 * @access  Private (Super Admin)
 */
router.post('/generate-for-admin/:adminId', verifyToken, isSuperAdmin, billController.generateBillsForAdmin);

/**
 * @route   GET /api/bills/profits/total
 * @desc    Get total profit for authenticated admin
 * @access  Private
 */
router.get('/profits/total', verifyToken, billController.getTotalProfit);

module.exports = router;
