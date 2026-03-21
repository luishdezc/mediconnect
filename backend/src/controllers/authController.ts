import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import User, { IUser } from '../models/User';
import Patient from '../models/Patient';
import Doctor from '../models/Doctor';
import { sendWelcomeEmail } from '../services/emailService';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [patient, doctor]
 *               specialization:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, specialization, licenseNumber, dateOfBirth } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: 'El correo ya está registrado' });
      return;
    }

    if (!['patient', 'doctor'].includes(role)) {
      res.status(400).json({ message: 'Rol inválido' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      authType: 'local',
    });

    if (role === 'patient') {
      await Patient.create({ userId: user._id, dateOfBirth });
    } else if (role === 'doctor') {
      if (!specialization || !licenseNumber) {
        await User.findByIdAndDelete(user._id);
        res.status(400).json({ message: 'Especialidad y cédula profesional son requeridas' });
        return;
      }
      await Doctor.create({ userId: user._id, specialization, licenseNumber });
    }

    await sendWelcomeEmail(user.email, user.name);

    req.login(user, (err) => {
      if (err) {
        res.status(500).json({ message: 'Error al iniciar sesión' });
        return;
      }
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('local', (err: Error, user: IUser, info: { message: string }) => {
    if (err) return next(err);
    if (!user) {
      res.status(401).json({ message: info?.message || 'Credenciales inválidas' });
      return;
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({
        message: 'Sesión iniciada',
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    });
  })(req, res, next);
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
export const logout = (req: Request, res: Response): void => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Sesión cerrada' });
    });
  });
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Not authenticated
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    if (!user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    res.json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const googleCallback = (req: Request, res: Response): void => {
  const user = req.user as IUser;
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?role=${user.role}`);
};
