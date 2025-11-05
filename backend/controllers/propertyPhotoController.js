const { PropertyPhoto, Property } = require('../models');
const { deleteFile, getFileUrl } = require('../utils/fileUpload');
const path = require('path');

/**
 * Upload property photos
 * POST /api/properties/:propertyId/photos
 */
const uploadPropertyPhotos = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const adminId = req.admin.id;

    // Verify property exists and belongs to admin
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership
    if (property.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only upload photos to your own properties.'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Check if this is the first photo (make it primary)
    const existingPhotos = await PropertyPhoto.count({
      where: { property_id: propertyId }
    });

    const isPrimary = existingPhotos === 0;

    // Create photo records for each uploaded file
    const photoRecords = await Promise.all(
      req.files.map(async (file, index) => {
        const relativePath = path.relative(
          path.join(__dirname, '..'),
          file.path
        );

        const fileUrl = getFileUrl(relativePath, req);
        console.log(`Creating photo record for file: ${file.originalname}`);
        console.log(`File path: ${relativePath}`);
        console.log(`File URL: ${fileUrl}`);

        return await PropertyPhoto.create({
          admin_id: adminId,
          property_id: propertyId,
          file_path: relativePath,
          file_url: fileUrl,
          original_filename: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          is_primary: isPrimary && index === 0 // First photo of first batch is primary
        });
      })
    );

    res.status(201).json({
      success: true,
      message: `${photoRecords.length} photo(s) uploaded successfully`,
      data: {
        photos: photoRecords
      }
    });
  } catch (error) {
    console.error('Upload property photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photos'
    });
  }
};

/**
 * Get all photos for a property
 * GET /api/properties/:propertyId/photos
 */
const getPropertyPhotos = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const adminId = req.admin.id;

    // Verify property exists and belongs to admin
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership
    if (property.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view photos of your own properties.'
      });
    }

    // Fetch photos
    const photos = await PropertyPhoto.findAll({
      where: { property_id: propertyId },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    res.json({
      success: true,
      data: {
        photos
      }
    });
  } catch (error) {
    console.error('Get property photos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos'
    });
  }
};

/**
 * Delete a property photo
 * DELETE /api/properties/:propertyId/photos/:photoId
 */
const deletePropertyPhoto = async (req, res) => {
  try {
    const { propertyId, photoId } = req.params;
    const adminId = req.admin.id;

    // Find the photo
    const photo = await PropertyPhoto.findByPk(photoId, {
      include: [{
        model: Property,
        as: 'property'
      }]
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found'
      });
    }

    // Check ownership
    if (photo.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own photos.'
      });
    }

    // Verify the photo belongs to the specified property
    if (photo.property_id !== parseInt(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Photo does not belong to this property'
      });
    }

    // Delete the file from filesystem
    deleteFile(photo.file_path);

    // If this was the primary photo, make the next one primary
    if (photo.is_primary) {
      const nextPhoto = await PropertyPhoto.findOne({
        where: { 
          property_id: propertyId,
          id: { [require('sequelize').Op.ne]: photoId }
        },
        order: [['created_at', 'DESC']]
      });

      if (nextPhoto) {
        await nextPhoto.update({ is_primary: true });
      }
    }

    // Delete the database record
    await photo.destroy();

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete property photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo'
    });
  }
};

/**
 * Set a photo as primary
 * PUT /api/properties/:propertyId/photos/:photoId/primary
 */
const setPrimaryPhoto = async (req, res) => {
  try {
    const { propertyId, photoId } = req.params;
    const adminId = req.admin.id;

    // Find the photo
    const photo = await PropertyPhoto.findByPk(photoId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found'
      });
    }

    // Check ownership
    if (photo.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Verify the photo belongs to the specified property
    if (photo.property_id !== parseInt(propertyId)) {
      return res.status(400).json({
        success: false,
        error: 'Photo does not belong to this property'
      });
    }

    // Remove primary status from all other photos of this property
    await PropertyPhoto.update(
      { is_primary: false },
      { where: { property_id: propertyId } }
    );

    // Set this photo as primary
    await photo.update({ is_primary: true });

    res.json({
      success: true,
      message: 'Primary photo updated successfully',
      data: { photo }
    });
  } catch (error) {
    console.error('Set primary photo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set primary photo'
    });
  }
};

module.exports = {
  uploadPropertyPhotos,
  getPropertyPhotos,
  deletePropertyPhoto,
  setPrimaryPhoto
};

