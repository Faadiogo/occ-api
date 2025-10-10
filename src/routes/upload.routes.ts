import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// Configurar multer para memória (não salva em disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  },
});

// Rotas protegidas (apenas admin)
router.post(
  '/image',
  authenticate,
  authorize(UserRole.ADMIN),
  upload.single('image'),
  UploadController.uploadImage
);

router.delete(
  '/image',
  authenticate,
  authorize(UserRole.ADMIN),
  UploadController.deleteImage
);

export default router;

