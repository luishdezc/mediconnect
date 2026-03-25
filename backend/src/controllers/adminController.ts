import { Request, Response } from 'express';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';

const PAGE_SIZE = 10;

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAppointments, pendingDoctors] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Doctor.countDocuments({ isApproved: false }),
    ]);

    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentAppointments = await Appointment.find()
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      stats: { totalUsers, totalDoctors, totalPatients, totalAppointments, pendingDoctors },
      appointmentsByStatus,
      recentAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const { role, search } = req.query;

    const filter: Record<string, any> = {};
    if (role) filter.role = role;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: users,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const getPendingDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const total = await Doctor.countDocuments({ isApproved: false });
    const doctors = await Doctor.find({ isApproved: false })
      .populate('userId', 'name email createdAt avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: doctors,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener doctores pendientes' });
  }
};

export const approveDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { approve } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { isApproved: approve, isVerified: approve },
      { new: true }
    ).populate('userId', 'name email');

    if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }

    res.json({
      message: approve ? 'Doctor aprobado' : 'Doctor rechazado',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar solicitud' });
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `Usuario ${user.isActive ? 'activado' : 'desactivado'}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado' });
  }
};
