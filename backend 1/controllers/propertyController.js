const { Property, Admin, Tenant, PropertyPhoto } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { getFileUrl } = require('../utils/fileUpload');

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
        { postal_code: { [Op.like]: `%${search}%` } }
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
    // Debug: log received data
    console.log('📥 Creating property - received data:', {
      title: req.body.title,
      address: req.body.address,
      city: req.body.city,
      postal_code: req.body.postal_code,
      property_type: req.body.property_type,
      monthly_rent: req.body.monthly_rent,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null,
      allBodyKeys: Object.keys(req.body)
    });
    
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
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        error: 'City is required'
      });
    }
    
    if (!postal_code || !postal_code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Postal code is required'
      });
    }
    
    if (!property_type || !property_type.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Property type is required'
      });
    }

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

    // Build property data object, only including optional fields if provided
    const propertyData = {
      admin_id: req.admin.id,
      title,
      description: description || undefined,
      address,
      city,
      state: state || undefined,
      postal_code: postal_code.trim(),
      property_type,
      monthly_rent: monthly_rent || undefined,
      photo: photoUrl || undefined,
      number_of_halls: toIntOrUndef(number_of_halls),
      number_of_kitchens: toIntOrUndef(number_of_kitchens),
      number_of_bathrooms: toIntOrUndef(number_of_bathrooms),
      number_of_parking_spaces: toIntOrUndef(number_of_parking_spaces),
      number_of_rooms: toIntOrUndef(number_of_rooms),
      number_of_gardens: toIntOrUndef(number_of_gardens)
    };
    
    // Only include country if it's provided and not empty
    if (country && country.trim()) {
      propertyData.country = country.trim();
    }

    const property = await Property.create(propertyData);

    // If a photo was uploaded, create a PropertyPhoto record
    let photoCreationError = null;
    if (req.file && req.file.filename) {
      try {
        // Verify file exists
        if (!fs.existsSync(req.file.path)) {
          throw new Error(`Uploaded file does not exist at path: ${req.file.path}`);
        }

        // Files are saved to 'public/uploads/' directory (to match server static serving)
        // req.file.path is the absolute path, e.g., C:\...\backend\public\uploads\filename.jpg
        // We need the relative path from backend root: public/uploads/filename.jpg
        const backendRoot = path.join(__dirname, '..');
        let relativePath = path.relative(backendRoot, req.file.path);
        
        // Normalize path separators for cross-platform compatibility
        relativePath = relativePath.replace(/\\/g, '/');
        
        // Ensure the path starts with 'public/uploads/' for consistency
        if (!relativePath.startsWith('public/uploads/')) {
          // If the file is directly in public/uploads, ensure correct path
          if (relativePath.startsWith('public/uploads')) {
            relativePath = relativePath;
          } else {
            // Reconstruct the path correctly
            relativePath = `public/uploads/${req.file.filename}`;
          }
        }
        
        console.log('📁 File path details:', {
          absolutePath: req.file.path,
          relativePath: relativePath,
          filename: req.file.filename,
          backendRoot: backendRoot
        });

        // Get the file URL using the same utility as PropertyPhoto controller
        const fileUrl = getFileUrl(relativePath, req);
        
        console.log('🔗 Generated file URL:', fileUrl);

        // Check if property already has photos (shouldn't happen on creation, but check anyway)
        const existingPhotosCount = await PropertyPhoto.count({
          where: { property_id: property.id }
        });

        // If this is the first photo for this property, it should be primary
        // Also, if creating a new property, the first photo should always be primary
        const isPrimary = existingPhotosCount === 0;

        // If there are existing photos, unset their primary status
        if (existingPhotosCount > 0) {
          await PropertyPhoto.update(
            { is_primary: false },
            { where: { property_id: property.id } }
          );
          console.log(`📸 Unset primary status for ${existingPhotosCount} existing photo(s)`);
        }

        console.log('📸 Creating PropertyPhoto record:', {
          filename: req.file.filename,
          absolutePath: req.file.path,
          fileExists: fs.existsSync(req.file.path),
          relativePath: relativePath,
          fileUrl: fileUrl,
          propertyId: property.id,
          adminId: req.admin.id,
          isPrimary: isPrimary,
          existingPhotosCount: existingPhotosCount
        });

        // Verify file exists before creating record
        const fullFilePath = path.join(backendRoot, relativePath);
        if (!fs.existsSync(fullFilePath)) {
          throw new Error(`File does not exist at expected path: ${fullFilePath}`);
        }
        
        console.log('✅ File verified at path:', fullFilePath);

        // Create PropertyPhoto record as primary photo
        const photoRecord = await PropertyPhoto.create({
          admin_id: req.admin.id,
          property_id: property.id,
          file_path: relativePath,
          file_url: fileUrl,
          original_filename: req.file.originalname || req.file.filename,
          file_size: req.file.size || 0,
          mime_type: req.file.mimetype || 'image/jpeg',
          is_primary: true // Always set as primary for new property creation
        });

        console.log('✅ PropertyPhoto record created successfully:', {
          photoId: photoRecord.id,
          fileUrl: photoRecord.file_url,
          propertyId: photoRecord.property_id,
          filePath: photoRecord.file_path,
          isPrimary: photoRecord.is_primary,
          fileExists: fs.existsSync(fullFilePath)
        });
        
        // Verify the record was saved by querying it back
        const verifyPhoto = await PropertyPhoto.findByPk(photoRecord.id);
        if (verifyPhoto) {
          console.log('✅ Verified PropertyPhoto exists in database:', {
            id: verifyPhoto.id,
            fileUrl: verifyPhoto.file_url,
            filePath: verifyPhoto.file_path
          });
        } else {
          console.error('❌ PropertyPhoto was not found after creation!');
        }
      } catch (photoError) {
        photoCreationError = photoError;
        console.error('❌ Failed to create PropertyPhoto record:', {
          error: photoError.message,
          stack: photoError.stack,
          filename: req.file?.filename,
          path: req.file?.path,
          fileExists: req.file?.path ? fs.existsSync(req.file.path) : false
        });
        // Don't fail the property creation if photo record creation fails
        // But log it clearly for debugging
      }
    } else {
      console.log('ℹ️ No photo file uploaded with property creation');
    }

    // Fetch the property with admin details and photos
    const propertyWithAdmin = await Property.findByPk(property.id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PropertyPhoto,
          as: 'photos',
          required: false,
          order: [['is_primary', 'DESC'], ['created_at', 'DESC']]
        }
      ]
    });
    
    // Log photos for debugging
    if (propertyWithAdmin && propertyWithAdmin.photos) {
      console.log(`📸 Property ${property.id} has ${propertyWithAdmin.photos.length} photo(s) after creation`);
      propertyWithAdmin.photos.forEach((photo) => {
        console.log(`   - Photo ${photo.id}: ${photo.file_url} (primary: ${photo.is_primary})`);
      });
    } else {
      console.log(`ℹ️ Property ${property.id} has no photos after creation`);
    }
    
    // If there was a photo creation error, log it but don't fail the request
    if (photoCreationError) {
      console.error('⚠️ Photo creation had errors but property was created:', photoCreationError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: {
        property: propertyWithAdmin
      },
      warning: photoCreationError ? `Property created but photo upload had issues: ${photoCreationError.message}` : undefined
    });
  } catch (error) {
    console.error('Create property error:', error);
    
    // Send detailed error message for validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err) => err.message).join(', ');
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationErrors}`
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
      error: error.message || 'Internal server error'
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

    // Build update data object
    const updateData = {
      title,
      description: description !== undefined ? description : property.description,
      address,
      city,
      state: state !== undefined ? state : property.state,
      postal_code: postal_code ? postal_code.trim() : property.postal_code,
      property_type,
      monthly_rent: monthly_rent !== undefined ? monthly_rent : property.monthly_rent,
      photo: updatedPhotoUrl,
      number_of_halls: toIntOrKeep(number_of_halls, property.number_of_halls),
      number_of_kitchens: toIntOrKeep(number_of_kitchens, property.number_of_kitchens),
      number_of_bathrooms: toIntOrKeep(number_of_bathrooms, property.number_of_bathrooms),
      number_of_parking_spaces: toIntOrKeep(number_of_parking_spaces, property.number_of_parking_spaces),
      number_of_rooms: toIntOrKeep(number_of_rooms, property.number_of_rooms),
      number_of_gardens: toIntOrKeep(number_of_gardens, property.number_of_gardens)
    };
    
    // Only include country if it's provided (empty string sets it to null)
    if (country !== undefined) {
      updateData.country = country && country.trim() ? country.trim() : null;
    }

    await property.update(updateData);

    // If a new photo was uploaded, create or update PropertyPhoto record
    if (req.file && req.file.filename) {
      try {
        // Files are saved to 'public/uploads/' directory (to match server static serving)
        const backendRoot = path.join(__dirname, '..');
        let relativePath = path.relative(backendRoot, req.file.path);
        
        // Normalize path separators for cross-platform compatibility
        relativePath = relativePath.replace(/\\/g, '/');
        
        // Ensure the path starts with 'public/uploads/' for consistency
        if (!relativePath.startsWith('public/uploads/')) {
          // If the file is directly in public/uploads, ensure correct path
          if (relativePath.startsWith('public/uploads')) {
            relativePath = relativePath;
          } else {
            // Reconstruct the path correctly
            relativePath = `public/uploads/${req.file.filename}`;
          }
        }
        
        console.log('📁 Update - File path details:', {
          absolutePath: req.file.path,
          relativePath: relativePath,
          filename: req.file.filename,
          backendRoot: backendRoot
        });

        // Get the file URL using the same utility as PropertyPhoto controller
        const fileUrl = getFileUrl(relativePath, req);
        
        console.log('🔗 Update - Generated file URL:', fileUrl);

        // Check if property already has photos
        const existingPhotos = await PropertyPhoto.count({
          where: { property_id: id }
        });

        const isPrimary = existingPhotos === 0;

        // Verify file exists before creating record
        const fullFilePath = path.join(backendRoot, relativePath);
        if (!fs.existsSync(fullFilePath)) {
          throw new Error(`File does not exist at expected path: ${fullFilePath}`);
        }
        
        console.log('📸 Creating PropertyPhoto record for update:', {
          filename: req.file.filename,
          absolutePath: req.file.path,
          relativePath: relativePath,
          fileUrl: fileUrl,
          propertyId: id,
          adminId: req.admin.id,
          isPrimary: isPrimary,
          existingPhotos: existingPhotos,
          fileExists: fs.existsSync(fullFilePath)
        });

        // Create PropertyPhoto record
        const photoRecord = await PropertyPhoto.create({
          admin_id: req.admin.id,
          property_id: id,
          file_path: relativePath,
          file_url: fileUrl,
          original_filename: req.file.originalname || req.file.filename,
          file_size: req.file.size || 0,
          mime_type: req.file.mimetype || 'image/jpeg',
          is_primary: isPrimary // First photo is primary
        });

        console.log('✅ PropertyPhoto record created for updated photo:', {
          photoId: photoRecord.id,
          fileUrl: photoRecord.file_url,
          filePath: photoRecord.file_path,
          fileExists: fs.existsSync(fullFilePath)
        });
      } catch (photoError) {
        console.error('❌ Failed to create PropertyPhoto record:', {
          error: photoError.message,
          stack: photoError.stack,
          filename: req.file?.filename,
          path: req.file?.path
        });
        // Don't fail the property update if photo record creation fails
      }
    } else {
      console.log('ℹ️ No photo file uploaded with property update');
    }

    // Fetch the updated property with admin details and photos
    const updatedProperty = await Property.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PropertyPhoto,
          as: 'photos',
          required: false,
          order: [['is_primary', 'DESC'], ['created_at', 'DESC']]
        }
      ]
    });
    
    // Log photos for debugging
    if (updatedProperty && updatedProperty.photos) {
      console.log(`📸 Property ${id} has ${updatedProperty.photos.length} photo(s) after update`);
    }

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
