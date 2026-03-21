import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { getFileUrl } from '../middlewares/upload';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { name } = req.body;

    const updates: Record<string, any> = {};
    if (name?.trim()) updates.name = name.trim();
    if (req.file) updates.avatar = getFileUrl(req.file);

    const updated = await User.findByIdAndUpdate(user._id, updates, { new: true }).select('-passwordHash');
    res.json({ message: 'Perfil actualizado', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { currentPassword, newPassword } = req.body;

    if (user.authType === 'google') {
      res.status(400).json({ message: 'Las cuentas de Google no tienen contraseña local' });
      return;
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser?.passwordHash) { res.status(400).json({ message: 'Sin contraseña establecida' }); return; }

    const match = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!match) { res.status(400).json({ message: 'Contraseña actual incorrecta' }); return; }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    dbUser.passwordHash = await bcrypt.hash(newPassword, 12);
    await dbUser.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contraseña' });
  }
};
