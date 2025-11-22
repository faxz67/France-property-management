/**
 * Form Validation Utilities
 * Comprehensive validation rules for all form inputs
 * @author Senior Developer
 * @version 1.0.0
 */

import {
  validateEmail,
  validatePhone,
  validateAmount,
  validateDate,
  sanitizeInput,
} from './security';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

/**
 * Validate a single field
 */
export function validateField(
  value: any,
  fieldName: string,
  rules: ValidationRules
): string | null {
  // Required check
  if (rules.required && (!value || String(value).trim() === '')) {
    return `${fieldName} est requis`;
  }
  
  // Skip other validations if field is empty and not required
  if (!value && !rules.required) {
    return null;
  }
  
  const stringValue = String(value);
  
  // Min length
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} doit contenir au moins ${rules.minLength} caractères`;
  }
  
  // Max length
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} ne peut pas dépasser ${rules.maxLength} caractères`;
  }
  
  // Pattern
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return `${fieldName} n'est pas valide`;
  }
  
  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }
  
  return null;
}

/**
 * Validate entire form
 */
export function validateForm(
  formData: Record<string, any>,
  validationRules: Record<string, ValidationRules>
): ValidationResult {
  const errors: Record<string, string> = {};
  
  Object.keys(validationRules).forEach(fieldName => {
    const value = formData[fieldName];
    const rules = validationRules[fieldName];
    
    const error = validateField(value, fieldName, rules);
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Tenant form validation rules
 */
export const tenantValidationRules: Record<string, ValidationRules> = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    custom: (value) => {
      const sanitized = sanitizeInput(value);
      if (sanitized !== value) {
        return 'Le nom contient des caractères non autorisés';
      }
      return null;
    },
  },
  email: {
    required: true,
    custom: (value) => {
      if (!validateEmail(value)) {
        return 'Adresse email invalide';
      }
      return null;
    },
  },
  phone: {
    required: true,
    custom: (value) => {
      if (!validatePhone(value)) {
        return 'Numéro de téléphone invalide (format: +33612345678)';
      }
      return null;
    },
  },
  propertyId: {
    required: true,
    custom: (value) => {
      if (!value || value === '' || value === '0') {
        return 'Veuillez sélectionner une propriété';
      }
      return null;
    },
  },
  rent: {
    required: true,
    custom: (value) => {
      if (!validateAmount(value)) {
        return 'Le montant du loyer doit être un nombre positif';
      }
      return null;
    },
  },
  checkInDate: {
    required: false,
    custom: (value) => {
      if (value && !validateDate(value, true)) {
        return 'Date d\'entrée invalide';
      }
      return null;
    },
  },
  checkOutDate: {
    required: false,
    custom: (value) => {
      if (value && !validateDate(value, true)) {
        return 'Date de sortie invalide';
      }
      return null;
    },
  },
};

/**
 * Property form validation rules
 */
export const propertyValidationRules: Record<string, ValidationRules> = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200,
    custom: (value) => {
      const sanitized = sanitizeInput(value);
      if (sanitized !== value) {
        return 'Le titre contient des caractères non autorisés';
      }
      return null;
    },
  },
  address: {
    required: true,
    minLength: 5,
    maxLength: 300,
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  country: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  rent: {
    required: true,
    custom: (value) => {
      if (!validateAmount(value)) {
        return 'Le loyer doit être un nombre positif';
      }
      if (Number(value) > 100000) {
        return 'Le loyer semble anormalement élevé';
      }
      return null;
    },
  },
  description: {
    required: false,
    maxLength: 2000,
  },
};

/**
 * Bill form validation rules
 */
export const billValidationRules: Record<string, ValidationRules> = {
  tenant_id: {
    required: true,
    custom: (value) => {
      if (!value || value === '' || value === '0') {
        return 'Veuillez sélectionner un locataire';
      }
      return null;
    },
  },
  property_id: {
    required: true,
    custom: (value) => {
      if (!value || value === '' || value === '0') {
        return 'Veuillez sélectionner une propriété';
      }
      return null;
    },
  },
  amount: {
    required: true,
    custom: (value) => {
      if (!validateAmount(value)) {
        return 'Le montant doit être un nombre positif';
      }
      if (Number(value) > 100000) {
        return 'Le montant semble anormalement élevé';
      }
      return null;
    },
  },
  month: {
    required: true,
    pattern: /^\d{4}-\d{2}$/,
    custom: (value) => {
      if (!value.match(/^\d{4}-\d{2}$/)) {
        return 'Format de mois invalide (YYYY-MM attendu)';
      }
      const [year, month] = value.split('-').map(Number);
      if (year < 2000 || year > 2100) {
        return 'Année invalide';
      }
      if (month < 1 || month > 12) {
        return 'Mois invalide';
      }
      return null;
    },
  },
  due_date: {
    required: false,
    custom: (value) => {
      if (value && !validateDate(value, true)) {
        return 'Date d\'échéance invalide';
      }
      return null;
    },
  },
  description: {
    required: false,
    maxLength: 500,
  },
};

/**
 * Admin form validation rules
 */
export const adminValidationRules: Record<string, ValidationRules> = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    custom: (value) => {
      const sanitized = sanitizeInput(value);
      if (sanitized !== value) {
        return 'Le nom contient des caractères non autorisés';
      }
      return null;
    },
  },
  email: {
    required: true,
    custom: (value) => {
      if (!validateEmail(value)) {
        return 'Adresse email invalide';
      }
      return null;
    },
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 100,
    custom: (value) => {
      // Basic password strength check
      if (!/[a-z]/.test(value)) {
        return 'Le mot de passe doit contenir au moins une lettre minuscule';
      }
      if (!/[A-Z]/.test(value)) {
        return 'Le mot de passe doit contenir au moins une lettre majuscule';
      }
      if (!/[0-9]/.test(value)) {
        return 'Le mot de passe doit contenir au moins un chiffre';
      }
      return null;
    },
  },
  role: {
    required: true,
    custom: (value) => {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(value)) {
        return 'Rôle invalide';
      }
      return null;
    },
  },
};

/**
 * Login form validation rules
 */
export const loginValidationRules: Record<string, ValidationRules> = {
  email: {
    required: true,
    custom: (value) => {
      if (!validateEmail(value)) {
        return 'Adresse email invalide';
      }
      return null;
    },
  },
  password: {
    required: true,
    minLength: 6,
  },
};

/**
 * Expense form validation rules
 */
export const expenseValidationRules: Record<string, ValidationRules> = {
  amount: {
    required: true,
    custom: (value) => {
      if (!validateAmount(value)) {
        return 'Le montant doit être un nombre positif';
      }
      if (Number(value) > 1000000) {
        return 'Le montant semble anormalement élevé';
      }
      return null;
    },
  },
  type: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  description: {
    required: false,
    maxLength: 500,
  },
  date: {
    required: true,
    custom: (value) => {
      if (!validateDate(value, false)) {
        return 'Date invalide ou future';
      }
      return null;
    },
  },
  property_id: {
    required: false,
  },
};

/**
 * Validate tenant data before submission
 */
export function validateTenantData(data: Record<string, any>): ValidationResult {
  return validateForm(data, tenantValidationRules);
}

/**
 * Validate property data before submission
 */
export function validatePropertyData(data: Record<string, any>): ValidationResult {
  return validateForm(data, propertyValidationRules);
}

/**
 * Validate bill data before submission
 */
export function validateBillData(data: Record<string, any>): ValidationResult {
  return validateForm(data, billValidationRules);
}

/**
 * Validate admin data before submission
 */
export function validateAdminData(data: Record<string, any>): ValidationResult {
  return validateForm(data, adminValidationRules);
}

/**
 * Validate login data before submission
 */
export function validateLoginData(data: Record<string, any>): ValidationResult {
  return validateForm(data, loginValidationRules);
}

/**
 * Validate expense data before submission
 */
export function validateExpenseData(data: Record<string, any>): ValidationResult {
  return validateForm(data, expenseValidationRules);
}

