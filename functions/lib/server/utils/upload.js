"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFileUrl = exports.uploadChatFile = exports.uploadDocument = exports.uploadProfilePhoto = void 0;
// File upload configuration using FREE Cloudinary (25 GB storage + 25 GB bandwidth/month)
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure Cloudinary (FREE tier)
const configureCloudinary = () => {
    if (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET) {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('✅ Cloudinary configured (FREE: 25GB storage)');
        return true;
    }
    console.warn('⚠️  Cloudinary not configured. Using local file storage.');
    console.warn('   Add CLOUDINARY_* variables to .env for cloud storage.');
    return false;
};
const isCloudinaryConfigured = configureCloudinary();
// Cloudinary storage (FREE - 25GB)
const cloudinaryStorage = isCloudinaryConfigured ? new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        const folder = req.uploadFolder || 'general';
        return {
            folder: `company-manager/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
            transformation: [
                // Optimize images automatically
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' },
            ],
        };
    },
}) : null;
// Local storage fallback (FREE - uses your disk space)
const localStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.uploadFolder || 'general';
        const uploadPath = path_1.default.join(process.cwd(), 'public', 'uploads', folder);
        // Create folder if it doesn't exist
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
// File filter for security
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images, PDF, and DOC files are allowed.'));
    }
};
// Create multer upload instances
exports.uploadProfilePhoto = (0, multer_1.default)({
    storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max for profile photos
    },
});
exports.uploadDocument = (0, multer_1.default)({
    storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max for documents
    },
});
exports.uploadChatFile = (0, multer_1.default)({
    storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max for chat files
    },
});
// Helper function to get file URL
const getFileUrl = (file) => {
    if (isCloudinaryConfigured && 'path' in file) {
        // Cloudinary URL
        return file.path;
    }
    else {
        // Local file URL
        const relativePath = file.path.replace(/\\/g, '/').split('/public')[1];
        return relativePath || `/uploads/${file.filename}`;
    }
};
exports.getFileUrl = getFileUrl;
// Helper function to delete file
const deleteFile = async (fileUrl) => {
    try {
        if (isCloudinaryConfigured && fileUrl.includes('cloudinary.com')) {
            // Extract public_id from Cloudinary URL
            const parts = fileUrl.split('/');
            const filename = parts[parts.length - 1].split('.')[0];
            const folder = parts[parts.length - 2];
            const publicId = `company-manager/${folder}/${filename}`;
            await cloudinary_1.v2.uploader.destroy(publicId);
            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
            return true;
        }
        else {
            // Delete local file
            const filePath = path_1.default.join(process.cwd(), 'public', fileUrl);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`✅ Deleted local file: ${filePath}`);
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error('Failed to delete file:', error);
        return false;
    }
};
exports.deleteFile = deleteFile;
exports.default = {
    uploadProfilePhoto: exports.uploadProfilePhoto,
    uploadDocument: exports.uploadDocument,
    uploadChatFile: exports.uploadChatFile,
    getFileUrl: exports.getFileUrl,
    deleteFile: exports.deleteFile,
    isCloudinaryConfigured,
};
//# sourceMappingURL=upload.js.map