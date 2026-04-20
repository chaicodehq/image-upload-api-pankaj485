import crypto from "crypto";
import multer from "multer";
import { extname } from "path";
import { UPLOAD_DIR } from "../app.js";
import { MulterError } from "multer";

/**
 * TODO: Configure multer for image uploads
 *
 * 1. Define __dirname and UPLOAD_DIR (path to uploads folder in project root)
 * 2. Create diskStorage with:
 *    - destination: UPLOAD_DIR
 *    - filename: Generate unique name using Date.now() and crypto.randomBytes(4).toString('hex')
 *      Format: {timestamp}-{random}{extension}
 * 3. Add fileFilter to validate:
 *    - Only allow image/jpeg, image/png, image/gif
 *    - Reject others with: cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false)
 * 4. Set limits:
 *    - fileSize: 5MB (5 * 1024 * 1024)
 * 5. Export upload middleware
 *
 * Example structure:
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 * const UPLOAD_DIR = path.join(__dirname, '../../uploads');
 *
 * const storage = multer.diskStorage({
 *   destination: (req, file, cb) => { ... },
 *   filename: (req, file, cb) => { ... }
 * });
 *
 * const fileFilter = (req, file, cb) => { ... };
 *
 * export const upload = multer({ storage, fileFilter, limits: { ... } });
 */

// Your code here

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
      const newFileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${extname(file.originalname)}`;
      cb(null, newFileName);
    },
  }),
  fileFilter: function (req, file, cb) {
    const validFormats = [".jpeg", ".png", ".gif"];
    const fileExtension = extname(file.originalname).toLowerCase();
    const isValidFormat = validFormats.includes(fileExtension);

    if (!isValidFormat) {
      const err = new Error(
        `Invalid file format. Allowed formats: ${validFormats.join(", ")}`,
      );
      err.code = "INVALID_FILE_TYPE"; // attach custom code
      return cb(err, false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single("image");

const handleFileUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          message: err.message,
        });
      }

      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({
          message: err.message,
        });
      }

      return res.status(500).json({
        message: err.message ?? "something went wrong while uploading file",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "no file uploaded",
      });
    }

    next();
  });

  // if (req.file.size > fileSizeLimit) {
  //   return res.status(400).json({
  //     success: false,
  //     message: `File size can't exceed more than 5MB`,
  //   });
  // }
};

export { handleFileUpload };
