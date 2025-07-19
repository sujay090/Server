import express from 'express';
import { upload } from '../middlewares/upload.js';
import {
  uploadPoster,
  generatePostersForCustomerByCategory,
  downloadPoster,
} from '../controllers/posterController.js';
import { verifyAdminToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/upload', verifyAdminToken, upload.single('posters'), uploadPoster);
router.post('/generate', generatePostersForCustomerByCategory);
router.get('/download/:id', downloadPoster);

export default router;
