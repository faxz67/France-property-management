const express = require('express');
const router = express.Router();
const { Expense } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.use(verifyToken, isAdmin);

// POST /api/expenses → Add new expense
router.post('/', async (req, res) => {
  try {
    const { type, amount, date } = req.body;
    if (!type || !String(type).trim()) {
      return res.status(400).json({ success: false, error: 'Expense type is required' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    const when = date ? new Date(date) : new Date();
    const yyyy = when.getFullYear();
    const mm = String(when.getMonth() + 1).padStart(2, '0');
    const dd = String(when.getDate()).padStart(2, '0');

    // For general expenses (not property-specific), we need property_id to be nullable
    // Let's skip property_id for now since it's for general expense tracking
    const created = await Expense.create({
      admin_id: req.admin.id,
      month: `${yyyy}-${mm}`,
      category: String(type).trim(),
      amount: amt,
      notes: null,
      created_at: new Date(`${yyyy}-${mm}-${dd}`)
    });

    return res.status(201).json({ success: true, data: { expense: created } });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/expenses → Fetch all expenses (for current admin)
router.get('/', async (req, res) => {
  try {
    const rows = await Expense.findAll({
      where: { admin_id: req.admin.id },
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { expenses: rows } });
  } catch (error) {
    console.error('List expenses error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/expenses/:id → Delete an expense (scoped to current admin)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`[DELETE expense] Admin ${req.admin.id} attempting to delete expense ${id}`);
    
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid expense id' });
    }

    // First, locate by id to distinguish not found vs forbidden
    const byId = await Expense.findOne({ where: { id } });
    if (!byId) {
      console.log(`[DELETE expense] Expense ${id} does not exist`);
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    if (byId.admin_id !== req.admin.id) {
      console.log(`[DELETE expense] Expense ${id} belongs to admin ${byId.admin_id}, access denied for admin ${req.admin.id}`);
      return res.status(403).json({ success: false, error: 'Access denied: expense belongs to another admin' });
    }

    await byId.destroy();
    console.log(`[DELETE expense] Successfully deleted expense ${id}`);
    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;


