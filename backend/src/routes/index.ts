import { Router as RecordRouter } from 'express';
import { createRecord, getPatientRecords, updateRecord, getMyRecords } from '../controllers/medicalRecordController';
import { isAuthenticated, isDoctor } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

export const recordRouter = RecordRouter();
recordRouter.get('/my', isAuthenticated, getMyRecords);
recordRouter.post('/', isAuthenticated, isDoctor, upload.array('files', 5), createRecord);
recordRouter.get('/patient/:patientId', isAuthenticated, getPatientRecords);
recordRouter.put('/:id', isAuthenticated, isDoctor, updateRecord);

// chatRoutes.ts
import { Router as ChatRouter } from 'express';
import { getOrCreateConversation, getMyConversations, getMessages } from '../controllers/chatController';
import { isAuthenticated as authCheck } from '../middlewares/auth';

export const chatRouter = ChatRouter();
chatRouter.get('/conversations', authCheck, getMyConversations);
chatRouter.post('/conversations', authCheck, getOrCreateConversation);
chatRouter.get('/conversations/:conversationId/messages', authCheck, getMessages);

// adminRoutes.ts
import { Router as AdminRouter } from 'express';
import { getDashboardStats, getAllUsers, getPendingDoctors, approveDoctor, toggleUserStatus } from '../controllers/adminController';
import { isAuthenticated as adminAuth, isAdmin } from '../middlewares/auth';

export const adminRouter = AdminRouter();
adminRouter.use(adminAuth, isAdmin);
adminRouter.get('/stats', getDashboardStats);
adminRouter.get('/users', getAllUsers);
adminRouter.get('/doctors/pending', getPendingDoctors);
adminRouter.patch('/doctors/:id/approve', approveDoctor);
adminRouter.patch('/users/:id/toggle', toggleUserStatus);

// paymentRoutes.ts
import { Router as PaymentRouter } from 'express';
import { createCheckoutSession, stripeWebhook, getSubscriptionStatus } from '../controllers/paymentController';
import { isAuthenticated as payAuth, isDoctor as payDoctor } from '../middlewares/auth';
import express from 'express';

export const paymentRouter = PaymentRouter();
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
paymentRouter.post('/checkout', payAuth, payDoctor, createCheckoutSession);
paymentRouter.get('/status', payAuth, payDoctor, getSubscriptionStatus);
