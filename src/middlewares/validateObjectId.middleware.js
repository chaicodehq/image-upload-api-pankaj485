import mongoose from "mongoose";
import { Image } from "../models/image.model.js";

/**
 * TODO: Validate MongoDB ObjectId
 *
 * 1. Check if req.params.id is a valid MongoDB ObjectId
 *    Use: mongoose.Types.ObjectId.isValid(req.params.id)
 * 2. If invalid: return 400 with { error: { message: 'Invalid id format' } }
 * 3. If valid: call next()
 */
export async function validateObjectId(req, res, next) {
  // Your code here

  if (!req.params.id) {
    return res.status(400).json({
      error: {
        message: "file id required",
      },
    });
  }

  try {
    const existsImage = await Image.findById(req.params.id, { _id: 1 });

    if (!existsImage) {
      return res.status(404).json({
        error: {
          message: "file with provided id not found",
        },
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      error: {
        message: "invalid file id or id not provided",
      },
    });
  }
}
