import District from '../models/District.js';

/**
 * @desc    List all active districts
 * @route   POST /api/v1/districts/list
 * @access  Public
 */
export const list = async (req, res, next) => {
  try {
    const districts = await District.find({ isActive: true })
      .select('code name region center.coordinates photosCount')
      .sort({ region: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        districts,
        count: districts.length
      },
      message: 'Districts retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get district detail by code
 * @route   POST /api/v1/districts/detail
 * @access  Public
 */
export const detail = async (req, res, next) => {
  try {
    const { code } = req.body;

    // Validate input
    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'District code is required'
        }
      });
    }

    // Find district by code (return all fields)
    const district = await District.findOne({ 
      code: code.toLowerCase(),
      isActive: true 
    }).lean();

    // Check if district exists
    if (!district) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `District with code '${code}' not found`
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        district
      },
      message: 'District retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};
