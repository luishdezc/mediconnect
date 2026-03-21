import { Router } from 'express';
import {
  createAppointment, getMyAppointments, updateAppointmentStatus,
  getAvailableSlots, sendReminders,
} from '../controllers/appointmentController';
import { isAuthenticated, isAdmin, isPatient } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment booking and management
 */

router.get('/slots', getAvailableSlots);
router.get('/my', isAuthenticated, getMyAppointments);
router.post('/', isAuthenticated, isPatient, createAppointment);
router.patch('/:id/status', isAuthenticated, updateAppointmentStatus);
router.post('/send-reminders', isAuthenticated, isAdmin, sendReminders);

export default router;
