import mongoose, { Schema, Document } from 'mongoose';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentEndDate: Date;
  status: AppointmentStatus;
  type: 'in_person' | 'video';
  reason?: string;
  notes?: string;
  reminderSent: boolean;
  videoRoomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - appointmentDate
 *       properties:
 *         _id:
 *           type: string
 *         patientId:
 *           type: string
 *         doctorId:
 *           type: string
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *         type:
 *           type: string
 *           enum: [in_person, video]
 *         reason:
 *           type: string
 */
const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: Date, required: true },
    appointmentEndDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    type: { type: String, enum: ['in_person', 'video'], default: 'in_person' },
    reason: { type: String },
    notes: { type: String },
    reminderSent: { type: Boolean, default: false },
    videoRoomId: { type: String },
  },
  { timestamps: true }
);

AppointmentSchema.index({ patientId: 1, appointmentDate: -1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
AppointmentSchema.index({ status: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
