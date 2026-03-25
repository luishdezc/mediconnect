import { Router } from 'express';
import { updateProfile, updatePassword } from '../controllers/userController';
import { isAuthenticated } from '../middlewares/auth';
import { uploadAvatar } from '../middlewares/upload';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile (name, avatar)
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', isAuthenticated, uploadAvatar.single('avatar'), updateProfile);

/**
 * @swagger
 * /users/password:
 *   put:
 *     tags: [Users]
 *     summary: Update user password
 *     responses:
 *       200:
 *         description: Password updated
 */
router.put('/password', isAuthenticated, updatePassword);

export default router;
