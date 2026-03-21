import { Router } from 'express';
import passport from '../config/passport';
import {
  register, login, logout, getMe, googleCallback,
} from '../controllers/authController';
import { bootstrapAdmin } from '../controllers/bootstrapControllert';
import { isAuthenticated } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post('/register', register);
router.post('/login', login);
router.post('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, getMe);

router.post('/bootstrap-admin', bootstrapAdmin);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google` }),
  googleCallback
);

export default router;
