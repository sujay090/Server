import express from 'express';
import { register, login, profile, logout } from '../controllers/authController.js';
import { verifyAdminToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyAdminToken, profile);
router.post('/logout', logout);

export default router;
