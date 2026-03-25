import mongoose, { Schema, Document } from 'mongoose';

export interface IFileAttachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface IMedicalRecord extends Document {
  _id: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  diagnosis?: string;
  symptoms?: string[];
  treatment?: string;
  prescription?: string;
  notes?: string;
  followUpDate?: Date;
  fileAttachments: IFileAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         appointmentId:
 *           type: string
 *         patientId:
 *           type: string
 *         doctorId:
 *           type: string
 *         diagnosis:
 *           type: string
 *         notes:
 *           type: string
 *         fileAttachments:
 *           type: array
 *           items:
 *             type: object
 */
const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    diagnosis: { type: String },
    symptoms: [{ type: String }],
    treatment: { type: String },
    prescription: { type: String },
    notes: { type: String },
    followUpDate: { type: Date },
    fileAttachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        mimetype: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ appointmentId: 1 });

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
