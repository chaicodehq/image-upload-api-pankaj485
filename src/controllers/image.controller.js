import fs, { readdirSync, statSync } from "fs";
import path, { join, resolve } from "path";
import { fileURLToPath } from "url";
import { Image } from "../models/image.model.js";
import { generateThumbnail, getImageDimensions } from "../utils/thumbnail.js";
import { THUMBNAIL_DIR, UPLOAD_DIR } from "../app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * TODO: Upload image
 *
 * 1. Check if file uploaded (if !req.file, return 400 "No file uploaded")
 * 2. Get file info from req.file (filename, originalname, mimetype, size)
 * 3. Get image dimensions using getImageDimensions(filepath)
 * 4. Generate thumbnail using generateThumbnail(filename)
 * 5. Extract optional fields from req.body (description, tags)
 *    - Parse tags: split by comma and trim each tag
 * 6. Save metadata to database (Image.create)
 * 7. Return 201 with image metadata
 */
export async function uploadImage(req, res, next) {
  try {
    // Your code here

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const file = req.file;
    const { height, width } = await getImageDimensions(file.path);
    const thumbnailFilename = await generateThumbnail(file.filename);

    const date = new Date();

    let tags = [];

    if (req.body.tags) {
      tags = req.body.tags.split(",").map((_) => _.trim());
    }

    const metaData = await Image.create({
      description: req.body?.description ?? "",
      filename: file.filename,
      height: height,
      width: width,
      mimetype: file.mimetype,
      originalName: file.originalname,
      size: file.size,
      tags: tags,
      thumbnailFilename: thumbnailFilename,
      createdAt: date,
      updatedAt: date,
      uploadDate: date,
    });

    return res.status(201).json(metaData);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: List images with pagination and filtering
 *
 * 1. Extract query parameters:
 *    - page (default 1)
 *    - limit (default 10, max 50)
 *    - search (search in originalName and description)
 *    - mimetype (filter by mimetype)
 *    - sortBy (field to sort by, default 'uploadDate')
 *    - sortOrder (asc or desc, default 'desc')
 *
 * 2. Build MongoDB query:
 *    - Add text search if search parameter provided
 *    - Add mimetype filter if provided
 *
 * 3. Calculate pagination:
 *    - skip = (page - 1) * limit
 *    - total = await Image.countDocuments(query)
 *    - pages = Math.ceil(total / limit)
 *
 * 4. Fetch images with sorting and pagination:
 *    - Image.find(query).sort({[sortBy]: sortOrder === 'asc' ? 1 : -1}).skip(skip).limit(limit)
 *
 * 5. Calculate totalSize (sum of all image sizes)
 *
 * 6. Return 200 with:
 *    - data: images array
 *    - meta: { total, page, limit, pages, totalSize }
 */
export async function listImages(req, res, next) {
  const buildQuery = ({
    page = 1,
    limit = 10,
    search,
    mimetype,
    sortBy = "uploadDate",
    sortOrder = "desc",
  }) => {
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(50, Math.max(1, parseInt(limit) || 10));

    const skip = (page - 1) * limit;

    const query = {};

    if (mimetype) {
      query.mimetype = mimetype;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ originalName: regex }, { description: regex }];
    }

    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    return {
      query,
      sort,
      skip,
      limit,
      page,
    };
  };

  try {
    const { limit, query, skip, sort, page } = buildQuery(req.query);

    const [imageData, total] = await Promise.all([
      Image.find(query).sort(sort).skip(skip).limit(limit),
      Image.countDocuments(query),
    ]);

    const meta = {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      totalSize: imageData.reduce((prev, curr) => prev + curr.size, 0),
    };

    return res.status(200).json({
      meta,
      data: imageData,
    });
  } catch (error) {
    // next(error);

    return res.status(500).json({
      error: {
        message: "error getting image data",
      },
    });
  }
}

/**
 * TODO: Get image metadata by ID
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Return 200 with image metadata
 */
export async function getImage(req, res, next) {
  try {
    // Your code here

    const imageId = req.params.id;

    const data = await Image.findById(imageId);

    return res.status(200).json(data);
  } catch (error) {
    // next(error);
    return res.status(500).json({
      error: {
        message: "something went wrong while getting image data",
      },
    });
  }
}

/**
 * TODO: Download original image
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Construct file path
 * 4. Check if file exists using fs.existsSync()
 * 5. If file missing: return 404 "File not found"
 * 6. Set headers:
 *    - Content-Type: image.mimetype
 *    - Content-Disposition: attachment; filename="originalName"
 * 7. Send file using res.sendFile(filepath)
 */
export async function downloadImage(req, res, next) {
  try {
    // Your code here

    const fileId = req.params.id;

    const { filename } = await Image.findOne(
      { _id: fileId },
      { filename: 1, _id: 0 },
    );

    const fileOnDisk = readdirSync(UPLOAD_DIR, {
      encoding: "utf-8",
      recursive: true,
    }).find((_) => _ === filename);

    if (fileOnDisk) {
      const filePath = resolve(UPLOAD_DIR, filename);

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      return res.sendFile(filePath);
    }

    throw new Error("File not found in disk");

    return res.status(200).json(fileOnDisk);
  } catch (error) {
    // next(error);

    return res.status(500).json({
      error: {
        message:
          error?.message ?? "something went wrong while getting image data",
      },
    });
  }
}

/**
 * TODO: Download thumbnail
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Construct thumbnail path
 * 4. Check if thumbnail exists
 * 5. If missing: return 404 "File not found"
 * 6. Set headers:
 *    - Content-Type: image/jpeg (thumbnails are always JPEG)
 * 7. Send file using res.sendFile(thumbnailPath)
 */
export async function downloadThumbnail(req, res, next) {
  try {
    // Your code here

    const fileId = req.params.id;

    const { thumbnailFilename: filename } = await Image.findOne(
      { _id: fileId },
      { thumbnailFilename: 1, _id: 0 },
    );

    const fileOnDisk = readdirSync(THUMBNAIL_DIR, {
      encoding: "utf-8",
      recursive: true,
    }).find((_) => _ === filename);

    if (fileOnDisk) {
      const filePath = resolve(THUMBNAIL_DIR, filename);

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      return res.sendFile(filePath);
    }

    throw new Error("File not found in disk");

    return res.status(200).json(fileOnDisk);
  } catch (error) {
    // next(error);

    return res.status(500).json({
      error: {
        message:
          error?.message ?? "something went wrong while getting image data",
      },
    });
  }
}

/**
 * TODO: Delete image
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Delete original file (use try-catch, ignore ENOENT errors)
 * 4. Delete thumbnail (use try-catch, ignore ENOENT errors)
 * 5. Delete metadata from database
 * 6. Return 204 (no content)
 */
export async function deleteImage(req, res, next) {
  try {
    // Your code here

    try {
      const fileId = req.params.id;

      const { thumbnailFilename, filename } = await Image.findOne(
        { _id: fileId },
        { thumbnailFilename: 1, filename: 1, _id: 0 },
      );

      if (!thumbnailFilename || !filename) {
        throw new Error(
          "invalid request. file with requested id doesn't exist",
        );
      }

      const originalFilePath = resolve(UPLOAD_DIR, filename);
      const thumbnailPath = resolve(THUMBNAIL_DIR, thumbnailFilename);

      fs.unlinkSync(originalFilePath);
      fs.unlinkSync(thumbnailPath);

      await Image.deleteOne({ _id: imageId });

      return res.status(204);
    } catch (error) {
      return res.status(500).json({
        error: {
          message: error?.message ?? "error deleting requested image data",
        },
      });
    }
  } catch (error) {
    next(error);
  }
}
