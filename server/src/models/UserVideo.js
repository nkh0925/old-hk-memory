import mongoose from 'mongoose';

const userVideoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    photoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Photo',
      required: [true, 'Photo ID is required'],
    },
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      trim: true,
      unique: true,
    },
    prompt: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    url: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
    generatedAt: {
      type: Date,
    },
    error: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Query my-videos by userId efficiently
userVideoSchema.index({ userId: 1, createdAt: -1 });
// Query by jobId for status polling updates
userVideoSchema.index({ jobId: 1 });
// Query by photoId if needed
userVideoSchema.index({ photoId: 1 });

const UserVideo = mongoose.model('UserVideo', userVideoSchema);

export default UserVideo;