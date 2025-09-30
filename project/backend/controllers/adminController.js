const { Admin } = require('../models');
const { Op } = require('sequelize');

// Get all admins with pagination and filters
const getAllAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: admins } = await Admin.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        admin
      }
    });
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create new admin
const createAdmin = async (req, res) => {
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

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;

    const admin = await Admin.findByPk(id);
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

    // Update admin
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    await admin.update(updateData);

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Prevent deletion of the last SUPER_ADMIN
    if (admin.role === 'SUPER_ADMIN') {
      const superAdminCount = await Admin.count({
        where: { role: 'SUPER_ADMIN' }
      });
      
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last super admin'
        });
      }
    }

    await admin.destroy();

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get admin statistics
const getAdminStats = async (req, res) => {
  try {
    const totalAdmins = await Admin.count();
    const activeAdmins = await Admin.count({ where: { status: 'ACTIVE' } });
    const superAdmins = await Admin.count({ where: { role: 'SUPER_ADMIN' } });
    const regularAdmins = await Admin.count({ where: { role: 'ADMIN' } });

    res.json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        superAdmins,
        regularAdmins
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminStats
};
