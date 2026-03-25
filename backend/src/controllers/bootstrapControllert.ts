
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

export const bootstrapAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.BOOTSTRAP_SECRET;
    if (!secret) {
      res.status(403).json({ message: 'Bootstrap no habilitado. Usa el script createAdmin.' });
      return;
    }

    const { name, email, password, bootstrapSecret } = req.body;

    if (bootstrapSecret !== secret) {
      res.status(403).json({ message: 'Secret incorrecto' });
      return;
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      res.status(409).json({ message: 'Ya existe una cuenta de administrador. Usa el login normal.' });
      return;
    }

    if (!name || !email || !password) {
      res.status(400).json({ message: 'name, email y password son requeridos' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      existing.role = 'admin';
      await existing.save();
      res.json({ message: `Usuario ${email} actualizado a administrador` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      authType: 'local',
    });

    res.status(201).json({
      message: 'Cuenta de administrador creada',
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};