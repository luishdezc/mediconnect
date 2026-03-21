import { Request, Response } from 'express';
import Doctor from '../models/Doctor';
import User from '../models/User';
import Availability from '../models/Availability';
import { IUser } from '../models/User';

const PAGE_SIZE = 10;

/**
 * @swagger
 * /doctors:
 *   get:
 *     tags: [Doctors]
 *     summary: Get all approved doctors with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of doctors
 */
export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const { specialization, search, lat, lng, radius } = req.query;

    const filter: Record<string, any> = { isApproved: true };

    if (specialization) filter.specialization = { $regex: String(specialization), $options: 'i' };

    if (lat && lng && radius) {
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      const radiusDeg = parseFloat(radius as string) / 111;
      filter.locationLat = { $gte: latNum - radiusDeg, $lte: latNum + radiusDeg };
      filter.locationLng = { $gte: lngNum - radiusDeg, $lte: lngNum + radiusDeg };
    }

    let query = Doctor.find(filter).populate('userId', 'name email avatar');

    if (search) {
      const users = await User.find({ name: { $regex: String(search), $options: 'i' } }).select('_id');
      const userIds = users.map((u) => u._id);
      filter.$or = [
        { specialization: { $regex: String(search), $options: 'i' } },
        { userId: { $in: userIds } },
      ];
      query = Doctor.find(filter).populate('userId', 'name email avatar');
    }

    const total = await Doctor.countDocuments(filter);
    const doctors = await query
      .sort({ isFeatured: -1, rating: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: doctors,
      pagination: {
        page,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener doctores' });
  }
};

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     tags: [Doctors]
 *     summary: Get doctor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email avatar')
      .lean();

    if (!doctor) {
      res.status(404).json({ message: 'Doctor no encontrado' });
      return;
    }

    const availability = await Availability.find({ doctorId: doctor._id, isActive: true }).lean();
    res.json({ doctor, availability });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener doctor' });
  }
};

/**
 * @swagger
 * /doctors/profile:
 *   put:
 *     tags: [Doctors]
 *     summary: Update doctor profile
 *     responses:
 *       200:
 *         description: Profile updated
 */
export const updateDoctorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { bio, hourlyRate, locationLat, locationLng, locationAddress, phone, education, experience, languages } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { userId: user._id },
      { bio, hourlyRate, locationLat, locationLng, locationAddress, phone, education, experience, languages },
      { new: true }
    ).populate('userId', 'name email avatar');

    if (!doctor) {
      res.status(404).json({ message: 'Perfil de doctor no encontrado' });
      return;
    }

    res.json({ message: 'Perfil actualizado', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

/**
 * @swagger
 * /doctors/availability:
 *   get:
 *     tags: [Doctors]
 *     summary: Get current doctor availability
 *     responses:
 *       200:
 *         description: Availability list
 */
export const getMyAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }

    const availability = await Availability.find({ doctorId: doctor._id }).lean();
    res.json({ data: availability });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener disponibilidad' });
  }
};

/**
 * @swagger
 * /doctors/availability:
 *   post:
 *     tags: [Doctors]
 *     summary: Set doctor availability
 *     responses:
 *       200:
 *         description: Availability saved
 */
export const setAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }

    const { slots } = req.body as { slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; slotDuration: number }> };

    await Availability.deleteMany({ doctorId: doctor._id });
    const created = await Availability.insertMany(
      slots.map((s) => ({ ...s, doctorId: doctor._id }))
    );

    res.json({ message: 'Disponibilidad guardada', data: created });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar disponibilidad' });
  }
};

export const getSpecializations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const specs = await Doctor.distinct('specialization', { isApproved: true });
    res.json({ data: specs.sort() });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener especializaciones' });
  }
};

export const getMyPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }

    const Appointment = (await import('../models/Appointment')).default;
    const Patient = (await import('../models/Patient')).default;

    const patientIds = await Appointment.distinct('patientId', { doctorId: doctor._id });
    const total = patientIds.length;
    const paginatedIds = patientIds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const patients = await Patient.find({ _id: { $in: paginatedIds } })
      .populate('userId', 'name email avatar')
      .lean();

    res.json({
      data: patients,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pacientes' });
  }
};
