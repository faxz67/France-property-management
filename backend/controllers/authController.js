const jwt = require('jsonwebtoken');
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
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
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
      if (process.env.NODE_ENV !== 'production') {
        console.log('[auth.login] Admin not found or inactive for email:', email);
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify admin is active (double check)
    if (admin.status !== 'ACTIVE') {
      console.warn('[auth.login] Inactive admin attempted login:', admin.email);
      return res.status(401).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Check password against MariaDB stored hash
    const isPasswordValid = await admin.comparePassword(password);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.login] Password validation result:', isPasswordValid);
    }

    if (!isPasswordValid) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[auth.login] Invalid password for admin:', admin.email);
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(admin);

    // Prepare admin data (without password)
    const adminData = admin.toJSON();

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
      message: 'Login successful',
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
    const { name, email, password } = req.body;
    const adminId = req.admin.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

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
  logout
};
