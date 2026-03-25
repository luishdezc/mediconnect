import { Request, Response } from 'express';
import Review from '../models/Review';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import { IUser } from '../models/User';

const PAGE_SIZE = 10;

/**
 * @swagger
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review for a completed appointment
 */
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { appointmentId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'La calificación debe ser entre 1 y 5' }); return;
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) { res.status(404).json({ message: 'Paciente no encontrado' }); return; }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) { res.status(404).json({ message: 'Cita no encontrada' }); return; }
    if (appointment.status !== 'completed') {
      res.status(400).json({ message: 'Solo puedes calificar citas completadas' }); return;
    }
    if (!appointment.patientId.equals(patient._id)) {
      res.status(403).json({ message: 'No tienes permiso para calificar esta cita' }); return;
    }

    // One review per appointment
    const existing = await Review.findOne({ appointmentId });
    if (existing) {
      res.status(409).json({ message: 'Ya calificaste esta consulta' }); return;
    }

    const review = await Review.create({
      doctorId: appointment.doctorId,
      patientId: patient._id,
      appointmentId,
      rating,
      comment: comment?.trim() || '',
    });

    // Recalculate doctor rating
    const agg = await Review.aggregate([
      { $match: { doctorId: appointment.doctorId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (agg.length > 0) {
      await Doctor.findByIdAndUpdate(appointment.doctorId, {
        rating:       Math.round(agg[0].avg * 10) / 10,
        totalReviews: agg[0].count,
      });
    }

    await review.populate({ path: 'patientId', populate: { path: 'userId', select: 'name avatar' } });
    res.status(201).json({ message: 'Reseña publicada', review });
  } catch (error) {
    console.error('createReview error:', error);
    res.status(500).json({ message: 'Error al crear reseña' });
  }
};

/**
 * @swagger
 * /reviews/doctor/{doctorId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get paginated reviews for a doctor
 */
export const getDoctorReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const total   = await Review.countDocuments({ doctorId });
    const reviews = await Review.find({ doctorId })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name avatar' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: reviews,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reseñas' });
  }
};

/**
 * Check if the current patient can review a specific appointment
 */
export const canReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { appointmentId } = req.params;

    const patient     = await Patient.findOne({ userId: user._id });
    const appointment = await Appointment.findById(appointmentId);
    if (!patient || !appointment) { res.json({ canReview: false }); return; }

    const alreadyReviewed = await Review.exists({ appointmentId });
    const eligible = appointment.status === 'completed'
      && appointment.patientId.equals(patient._id)
      && !alreadyReviewed;

    res.json({ canReview: eligible });
  } catch {
    res.json({ canReview: false });
  }
};

/**
 * Get my review for a specific appointment
 */
export const getMyReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { appointmentId } = req.params;
    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) { res.json({ review: null }); return; }
    const review = await Review.findOne({ appointmentId, patientId: patient._id });
    res.json({ review });
  } catch {
    res.json({ review: null });
  }
};
