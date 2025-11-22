// French Date and Time Utilities

/**
 * Format a date to French locale
 * @param {string|Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatFrenchDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', finalOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
};

/**
 * Format a date and time to French locale
 * @param {string|Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date and time string
 */
export const formatFrenchDateTime = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('fr-FR', finalOptions);
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Date et heure invalides';
  }
};

/**
 * Format a time to French locale
 * @param {string|Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export const formatFrenchTime = (date, options = {}) => {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('fr-FR', finalOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Heure invalide';
  }
};

/**
 * Get current date in French format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Current date formatted in French
 */
export const getCurrentFrenchDate = (options = {}) => {
  return formatFrenchDate(new Date(), options);
};

/**
 * Get current date and time in French format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Current date and time formatted in French
 */
export const getCurrentFrenchDateTime = (options = {}) => {
  return formatFrenchDateTime(new Date(), options);
};

/**
 * Get current time in French format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Current time formatted in French
 */
export const getCurrentFrenchTime = (options = {}) => {
  return formatFrenchTime(new Date(), options);
};

/**
 * Get relative time in French (e.g., "il y a 2 heures")
 * @param {string|Date} date - The date to compare
 * @returns {string} Relative time string in French
 */
export const getRelativeFrenchTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else {
      return formatFrenchDate(dateObj);
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return 'Date invalide';
  }
};

/**
 * Get month name in French
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name in French
 */
export const getFrenchMonthName = (monthIndex) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[monthIndex] || 'Mois invalide';
};

/**
 * Get day name in French
 * @param {number} dayIndex - Day index (0-6, Sunday = 0)
 * @returns {string} Day name in French
 */
export const getFrenchDayName = (dayIndex) => {
  const days = [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
  ];
  return days[dayIndex] || 'Jour invalide';
};

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Check if a date is overdue
 * @param {string|Date} dueDate - The due date to check
 * @returns {boolean} True if the date is overdue
 */
export const isOverdue = (dueDate) => {
  try {
    const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    dueDateObj.setHours(0, 0, 0, 0); // Reset time to start of day
    return dueDateObj < today;
  } catch (error) {
    console.error('Error checking if date is overdue:', error);
    return false;
  }
};

/**
 * Get days until due date
 * @param {string|Date} dueDate - The due date
 * @returns {number} Days until due date (negative if overdue)
 */
export const getDaysUntilDue = (dueDate) => {
  try {
    const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);
    const diffTime = dueDateObj - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days until due:', error);
    return 0;
  }
};

/**
 * Format currency in French format
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'EUR')
 * @returns {string} Formatted currency string
 */
export const formatFrenchCurrency = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} €`;
  }
};

/**
 * Get current month in YYYY-MM format for forms
 * @returns {string} Current month in YYYY-MM format
 */
export const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get current date in YYYY-MM-DD format for forms
 * @returns {string} Current date in YYYY-MM-DD format
 */
export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get next month in YYYY-MM format
 * @returns {string} Next month in YYYY-MM format
 */
export const getNextMonth = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get due date (end of current month)
 * @returns {string} Due date in YYYY-MM-DD format
 */
export const getDueDate = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const year = lastDay.getFullYear();
  const month = String(lastDay.getMonth() + 1).padStart(2, '0');
  const day = String(lastDay.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
