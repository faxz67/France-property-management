const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Admin validation rules
const validateAdmin = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'SUPER_ADMIN'])
    .withMessage('Role must be either ADMIN or SUPER_ADMIN'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be either ACTIVE or INACTIVE'),
  
  handleValidationErrors
];

// Admin update validation (password optional)
const validateAdminUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'SUPER_ADMIN'])
    .withMessage('Role must be either ADMIN or SUPER_ADMIN'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be either ACTIVE or INACTIVE'),
  
  handleValidationErrors
];

// Property validation rules
const validateProperty = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('postal_code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  
  body('country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('property_type')
    .optional()
    .isIn(['APARTMENT', 'HOUSE', 'CONDO', 'STUDIO', 'OTHER'])
    .withMessage('Property type must be one of: APARTMENT, HOUSE, CONDO, STUDIO, OTHER'),
  
  body('monthly_rent')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Monthly rent must be between 0 and 1,000,000'),
  
  handleValidationErrors
];

// Tenant validation rules
const validateTenant = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage('Phone must be between 10 and 50 characters'),
  
  body('property_id')
    .isInt({ min: 1 })
    .withMessage('Property ID must be a positive integer'),
  
  body('lease_start')
    .optional()
    .isISO8601()
    .withMessage('Lease start date must be a valid date'),
  
  body('lease_end')
    .optional()
    .isISO8601()
    .withMessage('Lease end date must be a valid date'),
  
  body('rent_amount')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Rent amount must be between 0 and 1,000,000'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'EXPIRED'])
    .withMessage('Status must be one of: ACTIVE, INACTIVE, EXPIRED'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .bail()
    .customSanitizer((value) => value.toLowerCase()),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// Bill validation rules
const validateBill = [
  body('tenant_id')
    .isInt({ min: 1 })
    .withMessage('Tenant ID must be a positive integer'),
  
  body('property_id')
    .isInt({ min: 1 })
    .withMessage('Property ID must be a positive integer'),
  
  body('amount')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Amount must be between 0 and 1,000,000'),
  
  body('month')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format'),
  
  body('due_date')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['PENDING', 'PAID', 'OVERDUE', 'RECEIPT_SENT'])
    .withMessage('Status must be one of: PENDING, PAID, OVERDUE, RECEIPT_SENT'),
  
  handleValidationErrors
];

// Bill update validation
const validateBillUpdate = [
  body('amount')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Amount must be between 0 and 1,000,000'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['PENDING', 'PAID', 'OVERDUE', 'RECEIPT_SENT'])
    .withMessage('Status must be one of: PENDING, PAID, OVERDUE, RECEIPT_SENT'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must not exceed 255 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateAdmin,
  validateAdminUpdate,
  validateProperty,
  validateTenant,
  validateLogin,
  validateId,
  validatePagination,
  validateBill,
  validateBillUpdate
};
