import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'District code is required'],
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      enum: {
        values: ['hk_island', 'kowloon', 'new_territories'],
        message: 'Region must be hk_island, kowloon, or new_territories',
      },
    },
    center: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Center coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message: 'Invalid coordinates. Format: [longitude, latitude]',
        },
      },
    },
    photosCount: {
      type: Number,
      default: 0,
      min: [0, 'Photos count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ===================
// Indexes
// ===================
districtSchema.index({ code: 1 }, { unique: true });
districtSchema.index({ region: 1 });
districtSchema.index({ center: '2dsphere' }); // 地理空间索引

// ===================
// Static Methods
// ===================

/**
 * 根据 code 查找地区
 * @param {string} code
 * @returns {Promise<District|null>}
 */
districtSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toLowerCase(), isActive: true });
};

/**
 * 获取某个区域的所有地区
 * @param {string} region
 * @returns {Promise<District[]>}
 */
districtSchema.statics.findByRegion = function (region) {
  return this.find({ region, isActive: true }).sort({ name: 1 });
};

/**
 * 更新照片计数
 * @param {string} districtId
 * @param {number} increment - 增量（可为负数）
 */
districtSchema.statics.updatePhotosCount = function (districtId, increment = 1) {
  return this.findByIdAndUpdate(
    districtId,
    { $inc: { photosCount: increment } },
    { new: true }
  );
};

const District = mongoose.model('District', districtSchema);

export default District;
