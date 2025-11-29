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
    
    // CRITICAL: Complete isolation - each admin only sees themselves and admins they created
    // ALL admins (including SUPER_ADMIN) are completely isolated
    if (currentAdminRole === 'SUPER_ADMIN') {
      whereClause[Op.or] = [
        { created_by: currentAdminId }, // Admins created by this SUPER_ADMIN
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
    console.log('📝 Create admin request received:', {
      body: { ...req.body, password: '[HIDDEN]' },
      adminId: req.admin?.id,
      adminRole: req.admin?.role
    });

    const { name, email, password, role = 'ADMIN', status = 'ACTIVE' } = req.body;
    const currentAdminId = req.admin.id;
    const currentAdminRole = req.admin.role;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le nom est requis'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: 'L\'email est requis'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide'
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe est requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Only SUPER_ADMIN can create new admins
    if (currentAdminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les super administrateurs peuvent créer de nouveaux administrateurs'
      });
    }

    // Validate role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide. Doit être ADMIN ou SUPER_ADMIN'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Un administrateur avec cet email existe déjà'
      });
    }

    // Create new admin with creator tracking for ISOLATION
    const admin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
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
      message: 'Administrateur créé avec succès',
      data: {
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Create admin error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        error: `Erreur de validation: ${validationErrors}`
      });
    }

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Un administrateur avec cet email existe déjà'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur'
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
    console.log('🗑️  Delete admin request received:', {
      adminId: req.params.id,
      currentAdminId: req.admin?.id,
      currentAdminRole: req.admin?.role
    });

    const { id } = req.params;
    const currentAdminId = req.admin.id;
    const currentAdminRole = req.admin.role;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'administrateur invalide'
      });
    }

    const adminId = parseInt(id);

    // Only SUPER_ADMIN can delete admins
    if (currentAdminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les super administrateurs peuvent supprimer des administrateurs'
      });
    }

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Administrateur non trouvé'
      });
    }

    console.log('📋 Admin to delete:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      created_by: admin.created_by
    });

    // Cannot delete yourself
    if (adminId === currentAdminId) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Check access permissions - Complete isolation
    // Each SUPER_ADMIN can only delete admins they created
    // Cannot delete system admins (created_by is NULL) created by others
    if (admin.created_by === null) {
      // System/bootstrap admin - cannot be deleted by other SUPER_ADMINs for complete isolation
      console.log('❌ Cannot delete system/bootstrap admin (complete isolation):', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        currentAdminId
      });
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Vous ne pouvez supprimer que les administrateurs que vous avez créés.'
      });
    }
    
    // Check if current admin created this admin (complete isolation)
    const canAccess = await Admin.canAccess(currentAdminId, adminId);
    
    if (!canAccess) {
      console.log('❌ Access denied:', {
        currentAdminId,
        targetAdminId: adminId,
        targetCreatedBy: admin.created_by
      });
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Vous ne pouvez supprimer que les administrateurs que vous avez créés.'
      });
    }
    
    // Safety check: Ensure at least one SUPER_ADMIN remains if deleting a SUPER_ADMIN
    if (admin.role === 'SUPER_ADMIN') {
      const otherSuperAdminCount = await Admin.count({
        where: { 
          role: 'SUPER_ADMIN',
          id: { [Op.ne]: adminId }
        }
      });
      
      console.log(`📊 Other super admin count (excluding target): ${otherSuperAdminCount}`);
      
      if (otherSuperAdminCount === 0) {
        return res.status(400).json({
          success: false,
          error: 'Impossible de supprimer le dernier super administrateur. Il doit rester au moins un super administrateur actif.'
        });
      }
    }
    
    console.log('✅ Admin deletion allowed (isolation check passed)');

    console.log(`🗑️  Deleting admin by ${req.admin.email}:`, {
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    await admin.destroy();

    console.log(`✅ Admin deleted successfully:`, {
      id: admin.id,
      email: admin.email
    });

    res.json({
      success: true,
      message: 'Administrateur supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Delete admin error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Handle Sequelize errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer cet administrateur car il est référencé par d\'autres enregistrements'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur'
    });
  }
};

// Get admin statistics (WITH ISOLATION)
const getAdminStats = async (req, res) => {
  try {
    const currentAdminId = req.admin.id;
    const currentAdminRole = req.admin.role;

    // Build where clause with complete isolation
    let whereClause = {};
    
    if (currentAdminRole === 'SUPER_ADMIN') {
      // Complete isolation - only see self and admins they created
      whereClause = {
        [Op.or]: [
          { created_by: currentAdminId }, // Admins created by this SUPER_ADMIN
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
