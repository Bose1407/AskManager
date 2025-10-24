// File upload configuration using FREE Cloudinary (25 GB storage + 25 GB bandwidth/month)
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Cloudinary (FREE tier)
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    
    cloudinary.config({
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
const cloudinaryStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = (req as any).uploadFolder || 'general';
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
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = (req as any).uploadFolder || 'general';
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for security
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  } else {
    cb(new Error('Invalid file type. Only images, PDF, and DOC files are allowed.'));
  }
};

// Create multer upload instances
export const uploadProfilePhoto = multer({
  storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max for profile photos
  },
});

export const uploadDocument = multer({
  storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max for documents
  },
});

export const uploadChatFile = multer({
  storage: isCloudinaryConfigured ? cloudinaryStorage : localStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max for chat files
  },
});

// Helper function to get file URL
export const getFileUrl = (file: Express.Multer.File): string => {
  if (isCloudinaryConfigured && 'path' in file) {
    // Cloudinary URL
    return file.path;
  } else {
    // Local file URL
    const relativePath = (file as any).path.replace(/\\/g, '/').split('/public')[1];
    return relativePath || `/uploads/${file.filename}`;
  }
};

// Helper function to delete file
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    if (isCloudinaryConfigured && fileUrl.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const parts = fileUrl.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      const publicId = `company-manager/${folder}/${filename}`;
      
      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Deleted from Cloudinary: ${publicId}`);
      return true;
    } else {
      // Delete local file
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted local file: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
};

export default {
  uploadProfilePhoto,
  uploadDocument,
  uploadChatFile,
  getFileUrl,
  deleteFile,
  isCloudinaryConfigured,
};
