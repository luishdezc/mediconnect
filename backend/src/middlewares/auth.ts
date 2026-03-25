import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    const user = req.user as IUser;
    if (!user.isActive) {
      res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
      return;
    }
    return next();
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
