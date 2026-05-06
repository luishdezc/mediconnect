import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 1. Session-based auth (localhost / same-domain)
  if (req.isAuthenticated()) {
    const user = req.user as IUser;
    if (!user.isActive) {
      res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
      return;
    }
    return next();
  }

  // 2. JWT-based auth (cross-domain production)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { _id: string };
      const user = await User.findById(payload._id);
      if (!user) { res.status(401).json({ message: 'Usuario no encontrado' }); return; }
      if (!user.isActive) { res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador.' }); return; }
      req.user = user;
      return next();
    } catch {
      res.status(401).json({ message: 'Token inválido o expirado' });
      return;
    }
  }

  res.status(401).json({ message: 'Debes iniciar sesión para continuar' });
};

export const isDoctor = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUser;
  if (user?.role === 'doctor') return next();
  res.status(403).json({ message: 'Acceso exclusivo para médicos' });
};

export const isPatient = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUser;
  if (user?.role === 'patient') return next();
  res.status(403).json({ message: 'Acceso exclusivo para pacientes' });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUser;
  if (user?.role === 'admin') return next();
  res.status(403).json({ message: 'Acceso exclusivo para administradores' });
};

export const isDoctorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as IUser;
  if (user?.role === 'doctor' || user?.role === 'admin') return next();
  res.status(403).json({ message: 'Sin permiso' });
};
