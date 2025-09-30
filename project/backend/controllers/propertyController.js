const { Property, Admin, Tenant } = require('../models');
const { Op } = require('sequelize');

// Get all properties with pagination and filters
const getAllProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const propertyType = req.query.property_type || '';
    const city = req.query.city || '';
    const adminId = req.admin.role === 'SUPER_ADMIN' ? req.query.admin_id : req.admin.id;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    // SUPER_ADMIN can see all properties, ADMIN can only see their own
    if (req.admin.role === 'ADMIN') {
      whereClause.admin_id = req.admin.id;
    } else if (adminId) {
      whereClause.admin_id = adminId;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (propertyType) {
      whereClause.property_type = propertyType;
    }
    
    if (city) {
      whereClause.city = { [Op.like]: `%${city}%` };
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Tenant,
          as: 'tenants',
          attributes: ['id', 'name', 'email', 'status'],
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
        properties,
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
    console.error('Get all properties error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Tenant,
          as: 'tenants',
          attributes: ['id', 'name', 'email', 'phone', 'lease_start', 'lease_end', 'rent_amount', 'status'],
          required: false
        }
      ]
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership for ADMIN
    if (req.admin.role === 'ADMIN' && property.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own properties.'
      });
    }

    res.json({
      success: true,
      data: {
        property
      }
    });
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Create new property
const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      state,
      postal_code,
      country,
      property_type,
      monthly_rent
    } = req.body;

    const property = await Property.create({
      admin_id: req.admin.id,
      title,
      description,
      address,
      city,
      state,
      postal_code,
      country,
      property_type,
      monthly_rent
    });

    // Fetch the property with admin details
    const propertyWithAdmin = await Property.findByPk(property.id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: {
        property: propertyWithAdmin
      }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update property
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      address,
      city,
      state,
      postal_code,
      country,
      property_type,
      monthly_rent
    } = req.body;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership for ADMIN
    if (req.admin.role === 'ADMIN' && property.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own properties.'
      });
    }

    // Update property
    await property.update({
      title,
      description,
      address,
      city,
      state,
      postal_code,
      country,
      property_type,
      monthly_rent
    });

    // Fetch the updated property with admin details
    const updatedProperty = await Property.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: {
        property: updatedProperty
      }
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete property
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership for ADMIN
    if (req.admin.role === 'ADMIN' && property.admin_id !== req.admin.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own properties.'
      });
    }

    await property.destroy();

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get property statistics
const getPropertyStats = async (req, res) => {
  try {
    const whereClause = req.admin.role === 'ADMIN' ? { admin_id: req.admin.id } : {};

    const totalProperties = await Property.count({ where: whereClause });
    const propertiesByType = await Property.findAll({
      where: whereClause,
      attributes: [
        'property_type',
        [Property.sequelize.fn('COUNT', Property.sequelize.col('id')), 'count']
      ],
      group: ['property_type']
    });

    const propertiesByCity = await Property.findAll({
      where: whereClause,
      attributes: [
        'city',
        [Property.sequelize.fn('COUNT', Property.sequelize.col('id')), 'count']
      ],
      group: ['city'],
      order: [[Property.sequelize.fn('COUNT', Property.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        totalProperties,
        propertiesByType,
        topCities: propertiesByCity
      }
    });
  } catch (error) {
    console.error('Get property stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats
};
