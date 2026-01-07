import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // 默认查询不返回密码
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either user or admin',
      },
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    photosCount: {
      type: Number,
      default: 0,
      min: [0, 'Photos count cannot be negative'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// ===================
// Indexes
// ===================
userSchema.index({ email: 1 }, { unique: true });

// ===================
// Pre-save Hook: Hash Password
// ===================
userSchema.pre('save', async function (next) {
  // 只有密码被修改时才进行哈希
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // 生成 salt 并哈希密码
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ===================
// Instance Methods
// ===================

/**
 * 比较密码
 * @param {string} candidatePassword - 用户输入的密码
 * @returns {Promise<boolean>} - 密码是否匹配
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// ===================
// Static Methods (可选，便于扩展)
// ===================

/**
 * 根据邮箱查找用户（包含密码字段）
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * 检查邮箱是否已存在
 * @param {string} email
 * @returns {Promise<boolean>}
 */
userSchema.statics.emailExists = async function (email) {
  const user = await this.findOne({ email: email.toLowerCase() });
  return !!user;
};

const User = mongoose.model('User', userSchema);

export default User;
