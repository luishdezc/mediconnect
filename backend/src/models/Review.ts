import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId:     mongoose.Types.ObjectId;
  patientId:    mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  rating:  number; // 1–5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:       { type: string }
 *         doctorId:  { type: string }
 *         patientId: { type: string }
 *         rating:    { type: integer, minimum: 1, maximum: 5 }
 *         comment:   { type: string }
 */
const ReviewSchema = new Schema<IReview>(
  {
    doctorId:      { type: Schema.Types.ObjectId, ref: 'Doctor',      required: true },
    patientId:     { type: Schema.Types.ObjectId, ref: 'Patient',     required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

ReviewSchema.index({ doctorId: 1, createdAt: -1 });
ReviewSchema.index({ patientId: 1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
