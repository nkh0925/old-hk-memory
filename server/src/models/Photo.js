import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    // Image URLs stored in Azure Blob Storage
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },

    // Photo story
    story: {
      type: String,
      maxlength: [2000, 'Story cannot exceed 2000 characters'],
      trim: true
    },

    // GeoJSON location for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function(coords) {
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates format. Must be [longitude, latitude]'
        }
      },
      address: {
        type: String,
        trim: true
      }
    },

    // District reference
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District is required']
    },
    districtCode: {
      type: String,
      required: [true, 'District code is required'],
      uppercase: true,
      trim: true
    },

    // Uploader reference
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required']
    },

    // Time period/era of the photo
    era: {
      type: String,
      enum: {
        values: ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', 'unknown'],
        message: '{VALUE} is not a valid era'
      },
      default: 'unknown'
    },

    /**
     * AI-generated video data (Doubao Video Generation)
     * Stores metadata and status for AI video generation from photo
     */
    aiVideo: {
      // Video generation status
      status: {
        type: String,
        enum: {
          values: ['none', 'pending', 'processing', 'completed', 'failed'],
          message: '{VALUE} is not a valid AI video status'
        },
        default: 'none'
      },
      // Azure Blob Storage URL of generated video
      url: {
        type: String,
        trim: true
      },
      // Prompt used for video generation (derived from story field)
      prompt: {
        type: String,
        trim: true
      },
      // Video duration in seconds
      duration: {
        type: Number,
        min: 0
      },
      // Doubao task/job ID for tracking generation progress
      jobId: {
        type: String,
        trim: true
      },
      // Timestamp when video was successfully generated
      generatedAt: {
        type: Date
      },
      // Error message if generation failed
      error: {
        type: String,
        trim: true
      }
    },

    // Moderation status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },

    // Engagement metrics
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for optimized queries
photoSchema.index({ location: '2dsphere' }); // Geospatial queries
photoSchema.index({ districtCode: 1, status: 1 }); // Filter by district and status
photoSchema.index({ uploader: 1, createdAt: -1 }); // User's photos sorted by date
photoSchema.index({ era: 1, status: 1 }); // Filter by era
photoSchema.index({ status: 1, createdAt: -1 }); // Admin moderation queue
photoSchema.index({ 'aiVideo.status': 1 }); // Filter by AI video generation status

// Virtual for populate helpers
photoSchema.virtual('uploaderInfo', {
  ref: 'User',
  localField: 'uploader',
  foreignField: '_id',
  justOne: true
});

photoSchema.virtual('districtInfo', {
  ref: 'District',
  localField: 'district',
  foreignField: '_id',
  justOne: true
});

// Instance method to increment view count
photoSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to find photos near a location
photoSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    status: 'approved'
  });
};

// Static method to find photos by district
photoSchema.statics.findByDistrict = function(districtCode, options = {}) {
  const query = {
    districtCode: districtCode.toUpperCase(),
    status: options.status || 'approved'
  };
  
  return this.find(query)
    .populate('uploader', 'username avatar')
    .populate('district', 'name code')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20);
};

// Pre-save middleware to ensure location is set correctly
photoSchema.pre('save', function(next) {
  if (this.isModified('location') && this.location.coordinates) {
    // Ensure coordinates are numbers
    this.location.coordinates = this.location.coordinates.map(coord => Number(coord));
  }
  next();
});

const Photo = mongoose.model('Photo', photoSchema);

export default Photo;
