const { Admin } = require('../models');
const { Op } = require('sequelize');

// Get all admins with pagination and filters (WITH ISOLATION)
const getAllAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const offset = (page - 1) * limit;
    const currentAdminId = req.admin.id;
    const currentAdminRole = req.admin.role;

    // Build where clause with ISOLATION
    const whereClause = {};
    
    // CRITICAL: Isolation based on creator
    // Each super admin only sees admins they created + system admins (created_by is NULL)
    if (currentAdminRole === 'SUPER_ADMIN') {
      whereClause[Op.or] = [
        { created_by: currentAdminId },
        { created_by: null }, // System/bootstrap admins visible to all super admins
        { id: currentAdminId } // Current user can see themselves
      ];
    } else {
      // Regular admins cannot manage other admins
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges to manage admins'
      });
    }
    
    if (search) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      });
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

// Get admin by ID (WITH ACCESS CONTROL)
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.admin.id;

    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check access permissions using the model method
    const canAccess = await Admin.canAccess(currentAdminId, parseInt(id));
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view admins you created.'
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

// Create new admin (WITH CREATOR TRACKING)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role = 'ADMIN', status = 'ACTIVE' } = req.body;
    const currentAdminId = req.admin.id;
    const currentAdminRole = req.admin.role;

    // Only SUPER_ADMIN can create new admins
    if (currentAdminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can create new admins'
      });
    }

    // Validate role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be ADMIN or SUPER_ADMIN'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists'
      });
    }

    // Create new admin with creator tracking for ISOLATION
    const admin = await Admin.create({
      name,
      email,
      password,
      role,
      status,
      created_by: currentAdminId // Track who created this admin
    });

    console.log(`✅ Admin created by ${req.admin.email} (ID: ${currentAdminId}):`, {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      created_by: admin.created_by
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

// Update admin (WITH ACCESS CONTROL)
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;
    const currentAdminId = req.admin.id;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check access permissions
    const canAccess = await Admin.canAccess(currentAdminId, parseInt(id));
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update admins you created.'
      });
    }

    // Prevent changing creator relationship
    if (req.body.created_by !== undefined) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify admin creator relationship'
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

    console.log(`✅ Admin updated by ${req.admin.email}:`, {
      id: admin.id,
      email: admin.email,
      changes: Object.keys(updateData)
    });

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

// Delete admin (WITH ACCESS CONTROL)
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.admin.id;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Cannot delete yourself
    if (parseInt(id) === currentAdminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check access permissions
    const canAccess = await Admin.canAccess(currentAdminId, parseInt(id));
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete admins you created.'
      });
    }

    // Prevent deletion of system admins (created_by is NULL)
    if (admin.created_by === null) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system/bootstrap admins'
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

    console.log(`🗑️  Admin deleted by ${req.admin.email}:`, {
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

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

// Get admin statistics (WITH ISOLATION)
const getAdminStats = async (req, res) => {
  try {
    const currentAdminId = req.admin.id;
    const currentAdminRole = req.admin.role;

    // Build where clause with isolation
    let whereClause = {};
    
    if (currentAdminRole === 'SUPER_ADMIN') {
      whereClause = {
        [Op.or]: [
          { created_by: currentAdminId },
          { created_by: null }, // System admins
          { id: currentAdminId } // Self
        ]
      };
    } else {
      // Regular admins see no stats
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges'
      });
    }

    const totalAdmins = await Admin.count({ where: whereClause });
    const activeAdmins = await Admin.count({ 
      where: { ...whereClause, status: 'ACTIVE' } 
    });
    const superAdmins = await Admin.count({ 
      where: { ...whereClause, role: 'SUPER_ADMIN' } 
    });
    const regularAdmins = await Admin.count({ 
      where: { ...whereClause, role: 'ADMIN' } 
    });

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
