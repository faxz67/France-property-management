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

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    // ALL admins (including SUPER_ADMIN) only see their own properties
    // This ensures complete data isolation between admins
    whereClause.admin_id = req.admin.id;
    
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

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (property.admin_id !== req.admin.id) {
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
      monthly_rent,
      number_of_halls,
      number_of_kitchens,
      number_of_bathrooms,
      number_of_parking_spaces,
      number_of_rooms,
      number_of_gardens
    } = req.body;

    // Derive photo URL if uploaded
    let photoUrl = null;
    if (req.file && req.file.filename) {
      // Build absolute URL from request origin for correctness across envs
      const origin = process.env.BACKEND_ORIGIN || `${req.protocol}://${req.get('host')}`;
      photoUrl = `${origin}/uploads/${req.file.filename}`;
    }

    const toIntOrUndef = (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : undefined;
    };

    // Debug: log incoming numeric fields
    if (process.env.NODE_ENV === 'development') {
      console.log('CreateProperty body numeric fields:', {
        number_of_halls,
        number_of_kitchens,
        number_of_bathrooms,
        number_of_parking_spaces,
        number_of_rooms,
        number_of_gardens
      });
    }

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
      monthly_rent,
      photo: photoUrl || undefined,
      number_of_halls: toIntOrUndef(number_of_halls),
      number_of_kitchens: toIntOrUndef(number_of_kitchens),
      number_of_bathrooms: toIntOrUndef(number_of_bathrooms),
      number_of_parking_spaces: toIntOrUndef(number_of_parking_spaces),
      number_of_rooms: toIntOrUndef(number_of_rooms),
      number_of_gardens: toIntOrUndef(number_of_gardens)
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
      monthly_rent,
      number_of_halls,
      number_of_kitchens,
      number_of_bathrooms,
      number_of_parking_spaces,
      number_of_rooms,
      number_of_gardens
    } = req.body;

    const property = await Property.findByPk(id);
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
        error: 'Access denied. You can only update your own properties.'
      });
    }

    // Derive photo URL if uploaded (optional update)
    let updatedPhotoUrl = property.photo;
    if (req.file && req.file.filename) {
      const origin = process.env.BACKEND_ORIGIN || `${req.protocol}://${req.get('host')}`;
      updatedPhotoUrl = `${origin}/uploads/${req.file.filename}`;
    }

    // Update property
    const toIntOrKeep = (v, prev) => {
      if (v === undefined || v === null || v === '') return prev;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : prev;
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('UpdateProperty body numeric fields:', {
        number_of_halls,
        number_of_kitchens,
        number_of_bathrooms,
        number_of_parking_spaces,
        number_of_rooms,
        number_of_gardens
      });
    }

    await property.update({
      title,
      description,
      address,
      city,
      state,
      postal_code,
      country,
      property_type,
      monthly_rent,
      photo: updatedPhotoUrl,
      number_of_halls: toIntOrKeep(number_of_halls, property.number_of_halls),
      number_of_kitchens: toIntOrKeep(number_of_kitchens, property.number_of_kitchens),
      number_of_bathrooms: toIntOrKeep(number_of_bathrooms, property.number_of_bathrooms),
      number_of_parking_spaces: toIntOrKeep(number_of_parking_spaces, property.number_of_parking_spaces),
      number_of_rooms: toIntOrKeep(number_of_rooms, property.number_of_rooms),
      number_of_gardens: toIntOrKeep(number_of_gardens, property.number_of_gardens)
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

    // Check ownership for ALL admins (including SUPER_ADMIN)
    if (property.admin_id !== req.admin.id) {
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
    // ALL admins (including SUPER_ADMIN) only see stats for their own properties
    const whereClause = { admin_id: req.admin.id };

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
