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

    // Find admin by email
    const admin = await Admin.findActiveByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(admin);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: admin.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
