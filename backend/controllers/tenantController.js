const { Tenant, Property, Admin } = require('../models');
const { Op } = require('sequelize');

// Get all tenants with pagination and filters
const getAllTenants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const propertyId = req.query.property_id || '';

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    // ALL admins (including SUPER_ADMIN) only see their own tenants
    // This ensures complete data isolation between admins
    whereClause.admin_id = req.admin.id;
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    const { count, rows: tenants } = await Tenant.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'property_type'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        tenants,
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
    console.error('Get all tenants error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An error occurred while fetching tenants'
    });
  }
};

// Get tenant by ID
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'property_type', 'monthly_rent'],
          required: false
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (tenant.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own tenants.'
      });
    }

    res.json({
      success: true,
      data: {
        tenant
      }
    });
  } catch (error) {
    console.error('Get tenant by ID error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An error occurred while fetching tenant'
    });
  }
};

// Create new tenant
const createTenant = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      property_id,
      lease_start,
      lease_end,
      rent_amount,
      charges_amount,
      status = 'ACTIVE'
    } = req.body;

    // Verify property exists and belongs to admin
    const property = await Property.findByPk(property_id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (property.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only add tenants to your own properties.'
      });
    }

    const tenant = await Tenant.create({
      admin_id: req.admin.id,
      property_id,
      name,
      email,
      phone,
      address: address?.trim() || null,
      lease_start,
      lease_end,
      rent_amount,
      charges_amount: charges_amount || null,
      status
    });

    // Fetch the tenant with related data
    const tenantWithDetails = await Tenant.findByPk(tenant.id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'property_type']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant: tenantWithDetails
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more detailed error messages
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${validationErrors}`
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update tenant
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      property_id,
      lease_start,
      lease_end,
      rent_amount,
      charges_amount,
      status
    } = req.body;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (tenant.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own tenants.'
      });
    }

    // If property_id is being updated, verify the new property exists and belongs to admin
    if (property_id && property_id !== tenant.property_id) {
      const property = await Property.findByPk(property_id);
      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found'
        });
      }

      if (property.admin_id !== req.admin.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only assign tenants to your own properties.'
        });
      }
    }

    // Update tenant
    const updateData = {
      name,
      email,
      phone,
      address: address !== undefined ? (address?.trim() || null) : tenant.address,
      property_id: property_id || tenant.property_id,
      lease_start,
      lease_end,
      rent_amount,
      charges_amount: charges_amount !== undefined ? (charges_amount || null) : tenant.charges_amount
    };
    
    // Handle status update - always ensure status is valid and saved to DB
    // Status can be set by admin to ACTIVE, INACTIVE, or EXPIRED
    if (status !== undefined && status !== null && status !== '') {
      const normalizedStatus = status.toUpperCase().trim();
      if (['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(normalizedStatus)) {
        updateData.status = normalizedStatus;
        console.log(`🔄 Admin updating tenant ${id} status from ${tenant.status} to: ${normalizedStatus}`);
      } else {
        console.warn(`⚠️ Invalid status value received: ${status}, keeping current status: ${tenant.status}`);
        // Keep current status if invalid value provided
        updateData.status = tenant.status;
      }
    } else {
      // If status not provided, keep current status
      updateData.status = tenant.status;
      console.log(`ℹ️ No status provided, keeping current status: ${tenant.status}`);
    }
    
    // Always ensure status is set in updateData (required field)
    if (!updateData.status) {
      updateData.status = tenant.status || 'ACTIVE';
      console.log(`⚠️ Status was missing, defaulting to: ${updateData.status}`);
    }
    
    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
    console.log('📝 Status being saved to DB:', updateData.status);
    
    // Update tenant in database
    await tenant.update(updateData);
    
    // Verify the update was saved - force reload from DB to avoid cache
    await tenant.reload({ force: true });
    console.log(`✅ Tenant ${id} updated successfully. Status in DB: ${tenant.status}`);
    
    // Verify status was saved correctly
    if (tenant.status !== updateData.status) {
      console.error(`❌ Status mismatch! Expected: ${updateData.status}, Got: ${tenant.status}`);
      // Force update status again
      await tenant.update({ status: updateData.status });
      await tenant.reload({ force: true });
      console.log(`🔄 Status corrected. New status: ${tenant.status}`);
    }
    
    // Fetch the updated tenant with fresh data from DB (bypass any cache)
    // Use a fresh query to ensure we get the latest data
    const updatedTenant = await Tenant.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'country', 'property_type'],
          required: false
        }
      ]
    });

    console.log(`✅ Tenant ${id} fetched after update. Status: ${updatedTenant?.status}`);
    
    // Final verification
    if (updatedTenant && updatedTenant.status) {
      console.log(`✅ Final status verification - Status in response: ${updatedTenant.status}`);
    } else {
      console.error(`❌ ERROR: Status is missing in response!`);
    }

    // Ensure status is always included in response
    if (!updatedTenant) {
      console.error(`❌ ERROR: updatedTenant is null for tenant ${id}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve updated tenant data'
      });
    }
    
    // Ensure status field is present
    if (!updatedTenant.status) {
      console.warn(`⚠️ WARNING: Status missing in updatedTenant, using tenant.status: ${tenant.status}`);
      updatedTenant.status = tenant.status;
    }
    
    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        tenant: updatedTenant
      }
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An error occurred while updating tenant'
    });
  }
};

// Delete tenant
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (tenant.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own tenants.'
      });
    }

    await tenant.destroy();

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get tenant statistics
const getTenantStats = async (req, res) => {
  try {
    const whereClause = { admin_id: req.admin.id };

    const totalTenants = await Tenant.count({ where: whereClause });
    const activeTenants = await Tenant.count({ 
      where: { ...whereClause, status: 'ACTIVE' } 
    });
    const inactiveTenants = await Tenant.count({ 
      where: { ...whereClause, status: 'INACTIVE' } 
    });
    const expiredTenants = await Tenant.count({ 
      where: { ...whereClause, status: 'EXPIRED' } 
    });

    // Get tenants by property
    const tenantsByProperty = await Tenant.findAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title']
        }
      ],
      attributes: [
        'property_id',
        [Tenant.sequelize.fn('COUNT', Tenant.sequelize.col('Tenant.id')), 'count']
      ],
      group: ['property_id', 'property.id', 'property.title'],
      order: [[Tenant.sequelize.fn('COUNT', Tenant.sequelize.col('Tenant.id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        inactiveTenants,
        expiredTenants,
        tenantsByProperty
      }
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantStats
};
