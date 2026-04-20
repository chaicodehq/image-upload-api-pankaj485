import mongoose from "mongoose";

/**
 * TODO: Define Image schema
 *
 * Fields:
 * - originalName: String, required, trim, maxlength 255
 * - filename: String, required, unique
 * - mimetype: String, required, enum: ['image/jpeg', 'image/png', 'image/gif']
 * - size: Number, required, min 1, max 5MB (5 * 1024 * 1024)
 * - width: Number, required, min 1
 * - height: Number, required, min 1
 * - thumbnailFilename: String, required
 * - description: String, optional, trim, maxlength 500, default ''
 * - tags: [String], optional, default [], max 10 tags
 *   Use validate: { validator: (arr) => arr.length <= 10, message: 'Cannot have more than 10 tags' }
 * - uploadDate: Date, default Date.now
 *
 * Options:
 * - Enable timestamps (createdAt, updatedAt)
 *
 * Indexes:
 * - uploadDate: -1
 * - mimetype: 1, uploadDate: -1
 * - Text index on originalName and description for search
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const imageSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    filename: { type: String, required: true, unique: true },
    mimetype: {
      type: String,
      required: true,
      default: "image/jpeg",
      enum: ["image/jpeg", "image/png", "image/gif"],
      message: "{VALUE} is not supported",
    },
    size: { type: Number, required: true, min: 1, max: MAX_FILE_SIZE },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    thumbnailFilename: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: "Cannot have more than 10 tags",
      },
    },
    uploadDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// TODO: Add indexes
imageSchema.index({ uploadDate: -1 });
imageSchema.index({ mimetype: 1, uploadDate: -1 });
imageSchema.index({ originalName: "text", description: "text" });

// TODO: Create and export the Image model
export const Image = mongoose.model("Image", imageSchema);
