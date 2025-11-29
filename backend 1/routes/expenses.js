const express = require('express');
const router = express.Router();
const { Expense } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.use(verifyToken, isAdmin);

// POST /api/expenses → Add new expense
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /expenses - Request body:', JSON.stringify(req.body, null, 2));
    console.log('📝 Admin ID:', req.admin.id);
    
    const { type, amount, date, property_id } = req.body;
    
    // Validate required fields
    if (!type || !String(type).trim()) {
      console.error('❌ Validation failed: Expense type is required');
      return res.status(400).json({ success: false, error: 'Expense type is required' });
    }
    
    // Validate and parse amount
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      console.error('❌ Validation failed: Invalid amount', amount);
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    // Parse and validate date
    const when = date ? new Date(date) : new Date();
    if (isNaN(when.getTime())) {
      console.error('❌ Validation failed: Invalid date', date);
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    const yyyy = when.getFullYear();
    const mm = String(when.getMonth() + 1).padStart(2, '0');
    const dd = String(when.getDate()).padStart(2, '0');
    const month = `${yyyy}-${mm}`;

    // Validate property_id if provided
    let propertyId = null;
    if (property_id !== null && property_id !== undefined && property_id !== '') {
      const propId = Number(property_id);
      if (!Number.isFinite(propId) || propId <= 0) {
        console.error('❌ Validation failed: Invalid property_id', property_id);
        return res.status(400).json({ success: false, error: 'Invalid property_id' });
      }
      
      // Verify property exists and belongs to admin
      const { Property } = require('../models');
      const property = await Property.findOne({
        where: { id: propId, admin_id: req.admin.id }
      });
      
      if (!property) {
        console.error(`❌ Property ${propId} not found or access denied for admin ${req.admin.id}`);
        return res.status(404).json({ 
          success: false, 
          error: 'Property not found or access denied' 
        });
      }
      
      propertyId = propId;
      console.log(`✅ Property ${propertyId} validated for admin ${req.admin.id}`);
    } else {
      console.log('ℹ️ No property_id provided - creating general expense');
    }

    // Create expense
    const expenseData = {
      admin_id: req.admin.id,
      property_id: propertyId, // Can be null for general expenses
      month: month,
      category: String(type).trim(),
      amount: amt,
      notes: null,
      created_at: new Date(`${yyyy}-${mm}-${dd}`)
    };
    
    console.log('📤 Creating expense with data:', JSON.stringify(expenseData, null, 2));
    
    const created = await Expense.create(expenseData);

    // Log for debugging
    console.log(`✅ Created expense ID: ${created.id} for admin ${req.admin.id}`);
    console.log(`   Property ID: ${created.property_id || 'null (general)'}`);
    console.log(`   Category: "${created.category}"`);
    console.log(`   Amount: ${created.amount}€`);
    console.log(`   Month: ${created.month}`);
    console.log(`   Created at: ${created.created_at}`);

    return res.status(201).json({ 
      success: true, 
      data: { expense: created },
      message: propertyId ? `Expense created for property ${propertyId}` : 'General expense created'
    });
  } catch (error) {
    console.error('❌ Create expense error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message || 'Failed to create expense'
    });
  }
});

// GET /api/expenses → Fetch all expenses (for current admin)
router.get('/', async (req, res) => {
  try {
    const rows = await Expense.findAll({
      where: { admin_id: req.admin.id },
      attributes: ['id', 'property_id', 'admin_id', 'month', 'category', 'amount', 'notes', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });
    
    // Log for debugging
    console.log(`📊 Fetched ${rows.length} expenses for admin ${req.admin.id}`);
    const withProperty = rows.filter(e => e.property_id !== null).length;
    const withoutProperty = rows.filter(e => e.property_id === null).length;
    console.log(`   - With property_id: ${withProperty}`);
    console.log(`   - Without property_id (general): ${withoutProperty}`);
    
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


