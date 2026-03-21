import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Availability:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         doctorId:
 *           type: string
 *         dayOfWeek:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "17:00"
 *         slotDuration:
 *           type: integer
 *           example: 30
 */
const AvailabilitySchema = new Schema<IAvailability>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

export default mongoose.model<IAvailability>('Availability', AvailabilitySchema);
