const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');

// Generate JWT token
const generateToken = (admin) => {
  return jwt.sign(
    { 
      id: admin.id, 
      email: admin.email, 
      role: admin.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new admin (SUPER_ADMIN only)
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'ADMIN', status = 'ACTIVE' } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role,
      status
    });

    // Generate token
    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: admin.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Login admin
const login = async (req, res) => {
  const { recordFailedAttempt, resetFailedAttempts } = require('../middleware/security');
  const { logAuditEvent } = require('../services/auditService');
  
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
    const userAgent = req.headers['user-agent'];

    if (!email || !password) {
      await logAuditEvent({
        adminId: null,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        details: { email, reason: 'Missing credentials' },
        status: 'FAILED'
      });
      
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    // Log database query attempt
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.login] Attempting to find admin with email:', email);
    }

    // Find admin by email from MariaDB database
    const admin = await Admin.findActiveByEmail(email);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.login] Database query result:', {
        found: !!admin,
        adminId: admin?.id,
        adminEmail: admin?.email,
        adminStatus: admin?.status,
        adminRole: admin?.role
      });
    }

    if (!admin) {
      recordFailedAttempt(ipAddress, email);
      await logAuditEvent({
        adminId: null,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        details: { email, reason: 'Admin not found' },
        status: 'FAILED'
      });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[auth.login] Admin not found or inactive for email:', email);
      }
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe invalide'
      });
    }

    // Verify admin is active (double check)
    if (admin.status !== 'ACTIVE') {
      recordFailedAttempt(ipAddress, email);
      await logAuditEvent({
        adminId: admin.id,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        details: { email, reason: 'Account inactive' },
        status: 'FAILED'
      });
      
      console.warn('[auth.login] Inactive admin attempted login:', admin.email);
      return res.status(401).json({
        success: false,
        error: 'Le compte est inactif'
      });
    }

    // Check password against MariaDB stored hash
    const isPasswordValid = await admin.comparePassword(password);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.login] Password validation result:', isPasswordValid);
    }

    if (!isPasswordValid) {
      recordFailedAttempt(ipAddress, email);
      await logAuditEvent({
        adminId: admin.id,
        action: 'LOGIN',
        resource: 'AUTH',
        ipAddress,
        userAgent,
        details: { email, reason: 'Invalid password' },
        status: 'FAILED'
      });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[auth.login] Invalid password for admin:', admin.email);
      }
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe invalide'
      });
    }

    // Reset failed attempts on successful login
    resetFailedAttempts(ipAddress);
    
    // Generate JWT token
    const token = generateToken(admin);

    // Prepare admin data (without password)
    const adminData = admin.toJSON();

    // Log successful login
    await logAuditEvent({
      adminId: admin.id,
      action: 'LOGIN',
      resource: 'AUTH',
      ipAddress,
      userAgent,
      details: { email },
      status: 'SUCCESS'
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.login] Login successful for admin:', {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        hasToken: !!token
      });
    }

    // Return success response with admin data from MariaDB
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        admin: adminData,
        token
      }
    });
  } catch (error) {
    console.error('[auth.login] Database error:', error);
    console.error('[auth.login] Error stack:', error.stack);
    
    // Check for database connection errors
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }
    
    // Check for query errors
    if (error.name === 'SequelizeDatabaseError') {
      console.error('[auth.login] Database query error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get current admin profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: req.admin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update admin profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const adminId = req.admin.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    // Password changes should use changePassword endpoint

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check if email is already taken by another admin
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Email already taken'
        });
      }
    }

    await admin.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Change password (requires current password verification)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Find admin
    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      console.log(`❌ Password change failed for admin ${adminId}: Invalid current password`);
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await admin.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Hash the new password explicitly to ensure it's properly hashed
    // We hash manually to avoid double-hashing from the beforeUpdate hook
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log(`🔄 Updating password for admin ${adminId} (${admin.email})`);
    console.log(`   New password length: ${newPassword.length}`);
    console.log(`   Hashed password length: ${hashedPassword.length}`);
    
    // Update password directly in database to bypass hooks
    // This ensures the password is saved correctly without double-hashing
    await Admin.update(
      { password: hashedPassword },
      { 
        where: { id: adminId },
        individualHooks: false // Disable hooks to prevent double-hashing
      }
    );

    // Reload admin to get fresh data
    await admin.reload();
    
    // Verify the password was saved correctly by testing it
    const verifyPassword = await admin.comparePassword(newPassword);
    
    if (!verifyPassword) {
      console.error(`❌ Password verification failed after update for admin ${adminId}`);
      console.error(`   This means the password was not saved correctly in the database`);
      return res.status(500).json({
        success: false,
        error: 'Password update failed. Please try again.'
      });
    }

    console.log(`✅ Password changed successfully for admin ${adminId} (${admin.email})`);
    console.log(`   Password hash verified: ${verifyPassword}`);
    console.log(`   New password can be used for login`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to change password'
    });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
