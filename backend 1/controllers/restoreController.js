/**
 * Controller for restoring soft-deleted records
 */

const { Tenant, Property, Bill, Expense } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all soft-deleted records for a specific model
 */
const getDeletedRecords = async (req, res) => {
  try {
    const { model } = req.params; // 'tenant', 'property', 'bill', 'expense'
    const adminId = req.admin.id;
    
    let Model;
    let whereClause = { 
      deleted_at: { [Op.ne]: null },
      admin_id: adminId 
    };
    
    switch (model.toLowerCase()) {
      case 'tenant':
        Model = Tenant;
        break;
      case 'property':
        Model = Property;
        break;
      case 'bill':
        Model = Bill;
        break;
      case 'expense':
        Model = Expense;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid model type. Use: tenant, property, bill, or expense'
        });
    }
    
    // Find all soft-deleted records with paranoid: false to include deleted records
    const deletedRecords = await Model.findAll({
      where: whereClause,
      paranoid: false, // Include soft-deleted records
      order: [['deleted_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        model: model.toLowerCase(),
        count: deletedRecords.length,
        records: deletedRecords
      }
    });
  } catch (error) {
    console.error('Get deleted records error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Restore a soft-deleted record
 */
const restoreRecord = async (req, res) => {
  try {
    const { model, id } = req.params;
    const adminId = req.admin.id;
    
    let Model;
    
    switch (model.toLowerCase()) {
      case 'tenant':
        Model = Tenant;
        break;
      case 'property':
        Model = Property;
        break;
      case 'bill':
        Model = Bill;
        break;
      case 'expense':
        Model = Expense;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid model type. Use: tenant, property, bill, or expense'
        });
    }
    
    // Find the deleted record
    const deletedRecord = await Model.findOne({
      where: { 
        id,
        admin_id: adminId,
        deleted_at: { [Op.ne]: null }
      },
      paranoid: false // Include soft-deleted records
    });
    
    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        error: 'Deleted record not found or already restored'
      });
    }
    
    // Restore the record by setting deleted_at to null
    deletedRecord.deleted_at = null;
    await deletedRecord.save({ paranoid: false });
    
    console.log(`✅ Restored ${model} with ID ${id} for admin ${adminId}`);
    
    res.json({
      success: true,
      message: `${model} restored successfully`,
      data: deletedRecord
    });
  } catch (error) {
    console.error('Restore record error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Restore multiple records at once
 */
const restoreMultipleRecords = async (req, res) => {
  try {
    const { model } = req.params;
    const { ids } = req.body; // Array of IDs to restore
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ids must be a non-empty array'
      });
    }
    
    const adminId = req.admin.id;
    
    let Model;
    
    switch (model.toLowerCase()) {
      case 'tenant':
        Model = Tenant;
        break;
      case 'property':
        Model = Property;
        break;
      case 'bill':
        Model = Bill;
        break;
      case 'expense':
        Model = Expense;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid model type. Use: tenant, property, bill, or expense'
        });
    }
    
    // Find all deleted records matching the IDs
    const deletedRecords = await Model.findAll({
      where: { 
        id: { [Op.in]: ids },
        admin_id: adminId,
        deleted_at: { [Op.ne]: null }
      },
      paranoid: false
    });
    
    if (deletedRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No deleted records found with the provided IDs'
      });
    }
    
    // Restore all records
    const restorePromises = deletedRecords.map(record => {
      record.deleted_at = null;
      return record.save({ paranoid: false });
    });
    
    await Promise.all(restorePromises);
    
    console.log(`✅ Restored ${deletedRecords.length} ${model}(s) for admin ${adminId}`);
    
    res.json({
      success: true,
      message: `${deletedRecords.length} ${model}(s) restored successfully`,
      data: {
        restored: deletedRecords.length,
        records: deletedRecords
      }
    });
  } catch (error) {
    console.error('Restore multiple records error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Permanently delete a record (hard delete)
 * WARNING: This cannot be undone!
 */
const permanentlyDeleteRecord = async (req, res) => {
  try {
    const { model, id } = req.params;
    const adminId = req.admin.id;
    
    let Model;
    
    switch (model.toLowerCase()) {
      case 'tenant':
        Model = Tenant;
        break;
      case 'property':
        Model = Property;
        break;
      case 'bill':
        Model = Bill;
        break;
      case 'expense':
        Model = Expense;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid model type. Use: tenant, property, bill, or expense'
        });
    }
    
    // Find the deleted record
    const deletedRecord = await Model.findOne({
      where: { 
        id,
        admin_id: adminId,
        deleted_at: { [Op.ne]: null }
      },
      paranoid: false
    });
    
    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        error: 'Deleted record not found'
      });
    }
    
    // Permanently delete
    await deletedRecord.destroy({ force: true });
    
    console.log(`⚠️ Permanently deleted ${model} with ID ${id} for admin ${adminId}`);
    
    res.json({
      success: true,
      message: `${model} permanently deleted`
    });
  } catch (error) {
    console.error('Permanently delete record error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getDeletedRecords,
  restoreRecord,
  restoreMultipleRecords,
  permanentlyDeleteRecord
};

