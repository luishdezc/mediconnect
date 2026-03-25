import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { s3Client, S3_BUCKET } from '../config/aws';

const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Solo se permiten imágenes'));
};

const docFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido'));
};

const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);

const makeS3Storage = (folder: string) =>
  multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_req, file, cb) => cb(null, { originalname: file.originalname }),
    key: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${folder}/${unique}${path.extname(file.originalname)}`);
    },
  });

const makeDiskStorage = (subdir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = `uploads/${subdir}`;
      require('fs').mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

export const uploadAvatar = multer({
  storage: useS3 ? makeS3Storage('avatars') : makeDiskStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const upload = multer({
  storage: useS3 ? makeS3Storage('medical') : makeDiskStorage('medical'),
  fileFilter: docFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const getFileUrl = (file: Express.Multer.File): string => {
  if (useS3) {
    return (file as any).location; // S3 returns 'location'
  }
  return `/${file.path.replace(/\\/g, '/')}`;
};
