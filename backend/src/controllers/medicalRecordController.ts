import { Request, Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import { IUser } from '../models/User';
import { getFileUrl } from '../middlewares/upload';

const PAGE_SIZE = 10;

/**
 * @swagger
 * /records:
 *   post:
 *     tags: [MedicalRecords]
 *     summary: Create a medical record (doctor only)
 *     responses:
 *       201:
 *         description: Record created
 */
export const createRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { appointmentId, diagnosis, symptoms, treatment, prescription, notes, followUpDate } = req.body;

    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) { res.status(403).json({ message: 'Solo doctores pueden crear registros' }); return; }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) { res.status(404).json({ message: 'Cita no encontrada' }); return; }

    if (!appointment.doctorId.equals(doctor._id)) {
      res.status(403).json({ message: 'Sin permiso para esta cita' }); return;
    }

    const fileAttachments = (req.files as Express.Multer.File[] || []).map((f) => ({
      url: getFileUrl(f),
      filename: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      uploadedAt: new Date(),
    }));

    const record = await MedicalRecord.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: doctor._id,
      diagnosis,
      symptoms: symptoms ? JSON.parse(symptoms) : [],
      treatment,
      prescription,
      notes,
      followUpDate,
      fileAttachments,
    });

    appointment.status = 'completed';
    await appointment.save();

    res.status(201).json({ message: 'Expediente creado', record });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Error al crear expediente' });
  }
};

/**
 * @swagger
 * /records/patient/{patientId}:
 *   get:
 *     tags: [MedicalRecords]
 *     summary: Get medical records for a patient (paginated)
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of records
 */
export const getPatientRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { patientId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    // Authorization: patient can only see their own records; doctor can see any patient they've treated
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (!patient || patient._id.toString() !== patientId) {
        res.status(403).json({ message: 'Sin permiso' }); return;
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      const hasRelation = await Appointment.exists({ doctorId: doctor!._id, patientId });
      if (!hasRelation) { res.status(403).json({ message: 'Sin permiso' }); return; }
    }

    const total = await MedicalRecord.countDocuments({ patientId });
    const records = await MedicalRecord.find({ patientId })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } })
      .populate('appointmentId', 'appointmentDate type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: records,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener expedientes' });
  }
};

/**
 * @swagger
 * /records/{id}:
 *   put:
 *     tags: [MedicalRecords]
 *     summary: Update a medical record
 *     responses:
 *       200:
 *         description: Record updated
 */
export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) { res.status(403).json({ message: 'Sin permiso' }); return; }

    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, doctorId: doctor._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!record) { res.status(404).json({ message: 'Expediente no encontrado' }); return; }

    res.json({ message: 'Expediente actualizado', record });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar expediente' });
  }
};

export const getMyRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) { res.status(404).json({ message: 'Paciente no encontrado' }); return; }

    const total = await MedicalRecord.countDocuments({ patientId: patient._id });
    const records = await MedicalRecord.find({ patientId: patient._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } })
      .populate('appointmentId', 'appointmentDate type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: records,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener expedientes' });
  }
};
