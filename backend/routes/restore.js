/**
 * Routes for restoring soft-deleted records
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getDeletedRecords,
  restoreRecord,
  restoreMultipleRecords,
  permanentlyDeleteRecord
} = require('../controllers/restoreController');

// All routes require authentication
router.use(verifyToken);

// Get all deleted records for a model
router.get('/:model/deleted', getDeletedRecords);

// Restore a single record
router.post('/:model/:id/restore', restoreRecord);

// Restore multiple records
router.post('/:model/restore-multiple', restoreMultipleRecords);

// Permanently delete a record (WARNING: cannot be undone)
router.delete('/:model/:id/permanent', permanentlyDeleteRecord);

module.exports = router;

