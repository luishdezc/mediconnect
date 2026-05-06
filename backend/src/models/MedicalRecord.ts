import mongoose, { Schema, Document } from 'mongoose';

export interface IFileAttachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface IPrescribedMed {
  name: string; 
  doseLabel: string;   
  pillsPerDay: number; 
  frequencyHours: number;
  durationDays: number; 
  startDate: Date;    
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
  medications: IPrescribedMed[]; 
  notes?: string;
  followUpDate?: Date;
  fileAttachments: IFileAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const PrescribedMedSchema = new Schema<IPrescribedMed>({
  name:            { type: String, required: true },
  doseLabel:       { type: String, required: true },
  pillsPerDay:     { type: Number, required: true, min: 1 },
  frequencyHours:  { type: Number, required: true, min: 1 },
  durationDays:    { type: Number, required: true, min: 1 },
  startDate:       { type: Date,   required: true, default: Date.now },
}, { _id: false });

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patientId:     { type: Schema.Types.ObjectId, ref: 'Patient',     required: true },
    doctorId:      { type: Schema.Types.ObjectId, ref: 'Doctor',      required: true },
    diagnosis:     { type: String },
    symptoms:      [{ type: String }],
    treatment:     { type: String },
    prescription:  { type: String },    
    medications:   { type: [PrescribedMedSchema], default: [] },
    notes:         { type: String },
    followUpDate:  { type: Date },
    fileAttachments: [{
      url:       { type: String, required: true },
      filename:  { type: String, required: true },
      mimetype:  { type: String },
      size:      { type: Number },
      uploadedAt:{ type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ appointmentId: 1 });

export default mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
