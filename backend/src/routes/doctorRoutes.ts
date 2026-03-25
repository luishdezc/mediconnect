import { Router } from 'express';
import {
  getDoctors, getDoctorById, updateDoctorProfile,
  getMyAvailability, setAvailability, getSpecializations,
  getMyPatients,
} from '../controllers/doctorController';
import { isAuthenticated, isDoctor } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor management endpoints
 */

router.get('/', getDoctors);
router.get('/specializations', getSpecializations);
router.get('/my-patients', isAuthenticated, isDoctor, getMyPatients);
router.get('/availability/my', isAuthenticated, isDoctor, getMyAvailability);
router.post('/availability', isAuthenticated, isDoctor, setAvailability);
router.put('/profile', isAuthenticated, isDoctor, updateDoctorProfile);
router.get('/:id', getDoctorById);

export default router;
