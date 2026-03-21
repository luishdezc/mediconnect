import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Availability from '../models/Availability';
import { IUser } from '../models/User';
import { sendAppointmentConfirmation, sendAppointmentReminder } from '../services/emailService';
import { getIO } from '../sockets/socketManager';

const PAGE_SIZE = 10;

const isSlotAvailable = async (doctorId: string, date: Date, endDate: Date): Promise<boolean> => {
  const conflict = await Appointment.findOne({
    doctorId,
    status: { $in: ['pending', 'confirmed', 'in_progress'] },
    $or: [
      { appointmentDate: { $lt: endDate }, appointmentEndDate: { $gt: date } },
    ],
  });
  return !conflict;
};

/**
 * @swagger
 * /appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Book a new appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, appointmentDate, type]
 *             properties:
 *               doctorId:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [in_person, video]
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked
 *       409:
 *         description: Slot not available
 */
export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { doctorId, appointmentDate, type, reason } = req.body;

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) { res.status(404).json({ message: 'Paciente no encontrado' }); return; }

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
    if (!doctor || !doctor.isApproved) { res.status(404).json({ message: 'Doctor no disponible' }); return; }

    const start = new Date(appointmentDate);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const available = await isSlotAvailable(doctorId, start, end);
    if (!available) {
      res.status(409).json({ message: 'El horario seleccionado ya no está disponible' });
      return;
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      appointmentDate: start,
      appointmentEndDate: end,
      type,
      reason,
      status: 'pending',
    });

    const io = getIO();
    const doctorUser = doctor.userId as any;
    io.to(`user:${doctorUser._id}`).emit('appointment:new', {
      appointment,
      patient: { name: user.name, email: user.email },
    });

    await sendAppointmentConfirmation(user.email, user.name, {
      doctorName: doctorUser.name,
      date: start,
      type,
    });

    res.status(201).json({ message: 'Cita agendada exitosamente', appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Error al agendar cita' });
  }
};

/**
 * @swagger
 * /appointments/my:
 *   get:
 *     tags: [Appointments]
 *     summary: Get current user's appointments (paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of appointments
 */
export const getMyAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const { status } = req.query;

    let filter: Record<string, any> = {};

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (!patient) { res.status(404).json({ message: 'Paciente no encontrado' }); return; }
      filter.patientId = patient._id;
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }
      filter.doctorId = doctor._id;
    }

    if (status) filter.status = status;

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email avatar' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email avatar' } })
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: appointments,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener citas' });
  }
};

/**
 * @swagger
 * /appointments/{id}/status:
 *   patch:
 *     tags: [Appointments]
 *     summary: Update appointment status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { status } = req.body;
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) { res.status(404).json({ message: 'Cita no encontrada' }); return; }

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (!appointment.patientId.equals(patient!._id)) {
        res.status(403).json({ message: 'Sin permiso' }); return;
      }
      if (!['cancelled'].includes(status)) {
        res.status(403).json({ message: 'Solo puedes cancelar citas' }); return;
      }
    }

    appointment.status = status;
    await appointment.save();

    const io = getIO();
    io.to(`appointment:${id}`).emit('appointment:statusUpdate', { id, status });

    res.json({ message: 'Estado actualizado', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar cita' });
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) { res.status(400).json({ message: 'doctorId y date requeridos' }); return; }

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();

    const availability = await Availability.findOne({ doctorId, dayOfWeek, isActive: true });
    if (!availability) { res.json({ data: [] }); return; }

    const slots: string[] = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m < endMinutes; m += availability.slotDuration) {
      const slotDate = new Date(targetDate);
      slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const slotEnd = new Date(slotDate.getTime() + availability.slotDuration * 60000);

      const busy = await Appointment.findOne({
        doctorId,
        status: { $in: ['pending', 'confirmed', 'in_progress'] },
        appointmentDate: { $lt: slotEnd },
        appointmentEndDate: { $gt: slotDate },
      });

      slots.push(JSON.stringify({ time: slotDate.toISOString(), available: !busy }));
    }

    res.json({ data: slots.map((s) => JSON.parse(s)) });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener slots' });
  }
};

export const sendReminders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'pending'] },
      reminderSent: false,
    })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    let sent = 0;
    for (const appt of appointments) {
      const patient = appt.patientId as any;
      const doctor = appt.doctorId as any;
      await sendAppointmentReminder(
        patient.userId.email,
        patient.userId.name,
        { doctorName: doctor.userId.name, date: appt.appointmentDate }
      );
      appt.reminderSent = true;
      await appt.save();
      sent++;
    }

    res.json({ message: `${sent} recordatorios enviados` });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar recordatorios' });
  }
};
