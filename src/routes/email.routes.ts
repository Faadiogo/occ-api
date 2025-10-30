import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post('/contact', EmailController.contact);
router.post('/talents', upload.single('resume'), EmailController.talents);
router.post('/newsletter', EmailController.newsletter);

export default router;


