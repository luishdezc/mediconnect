import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specialization: string;
  licenseNumber: string;
  isVerified: boolean;
  isApproved: boolean;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  bio?: string;
  hourlyRate?: number;
  phone?: string;
  education?: string[];
  experience?: number;
  languages?: string[];
  rating?: number;
  totalReviews?: number;
  isSubscribed: boolean;
  subscriptionId?: string;
  subscriptionExpiresAt?: Date;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         specialization:
 *           type: string
 *         licenseNumber:
 *           type: string
 *         isVerified:
 *           type: boolean
 *         isApproved:
 *           type: boolean
 *         locationLat:
 *           type: number
 *         locationLng:
 *           type: number
 *         bio:
 *           type: string
 *         hourlyRate:
 *           type: number
 *         rating:
 *           type: number
 *         isSubscribed:
 *           type: boolean
 *         isFeatured:
 *           type: boolean
 */
const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    locationLat: { type: Number },
    locationLng: { type: Number },
    locationAddress: { type: String },
    bio: { type: String },
    hourlyRate: { type: Number },
    phone: { type: String },
    education: [{ type: String }],
    experience: { type: Number },
    languages: [{ type: String }],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isSubscribed: { type: Boolean, default: false },
    subscriptionId: { type: String },
    subscriptionExpiresAt: { type: Date },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DoctorSchema.index({ specialization: 'text' });
DoctorSchema.index({ locationLat: 1, locationLng: 1 });
DoctorSchema.index({ isApproved: 1, isSubscribed: 1 });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
