import { Router } from 'express';
import { updatePatientProfile } from '../controllers/patientController';
import { isAuthenticated, isPatient } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /patients/profile:
 *   put:
 *     tags: [Patients]
 *     summary: Update patient medical profile
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', isAuthenticated, isPatient, updatePatientProfile);

export default router;
