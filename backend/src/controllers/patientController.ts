import { Request, Response } from 'express';
import Patient from '../models/Patient';
import { IUser } from '../models/User';

export const updatePatientProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const {
      dateOfBirth, gender, phone, address, bloodType,
      allergies, medicalHistorySummary, emergencyContact,
    } = req.body;

    const updates: Record<string, any> = {};
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (gender      !== undefined) updates.gender      = gender;
    if (phone       !== undefined) updates.phone       = phone;
    if (address     !== undefined) updates.address     = address;
    if (bloodType   !== undefined) updates.bloodType   = bloodType;
    if (allergies   !== undefined) updates.allergies   = allergies;
    if (medicalHistorySummary !== undefined) updates.medicalHistorySummary = medicalHistorySummary;
    if (emergencyContact      !== undefined) updates.emergencyContact      = emergencyContact;

    const patient = await Patient.findOneAndUpdate(
      { userId: user._id },
      updates,
      { new: true, upsert: false }
    ).populate('userId', 'name email avatar');

    if (!patient) { res.status(404).json({ message: 'Perfil de paciente no encontrado' }); return; }

    res.json({ message: 'Perfil actualizado', patient });
  } catch (error) {
    console.error('updatePatientProfile error:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};
