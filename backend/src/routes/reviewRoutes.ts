import { Router } from 'express';
import { createReview, getDoctorReviews, canReview, getMyReview } from '../controllers/reviewController';
import { isAuthenticated, isPatient } from '../middlewares/auth';

const router = Router();

router.post('/',                                    isAuthenticated, isPatient, createReview);
router.get('/doctor/:doctorId',                     getDoctorReviews);
router.get('/can-review/:appointmentId',            isAuthenticated, isPatient, canReview);
router.get('/my/:appointmentId',                    isAuthenticated, isPatient, getMyReview);

export default router;
