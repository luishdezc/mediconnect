import { Request, Response } from 'express';
import { Conversation, Message } from '../models/Chat';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import { IUser } from '../models/User';

const PAGE_SIZE = 10;

export const getOrCreateConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const { doctorId, patientId } = req.body;

    let convDoctorId = doctorId;
    let convPatientId = patientId;

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      convPatientId = patient!._id.toString();
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      convDoctorId = doctor!._id.toString();
    }

    let conversation = await Conversation.findOne({ patientId: convPatientId, doctorId: convDoctorId });

    if (!conversation) {
      conversation = await Conversation.create({ patientId: convPatientId, doctorId: convDoctorId });
    }

    await conversation.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name avatar' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } },
    ]);

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener conversación' });
  }
};

export const getMyConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    let filter: Record<string, any> = {};
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      filter.patientId = patient!._id;
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      filter.doctorId = doctor!._id;
    }

    const total = await Conversation.countDocuments(filter);
    const conversations = await Conversation.find(filter)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name avatar' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: conversations,
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener conversaciones' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const total = await Message.countDocuments({ conversationId });
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    res.json({
      data: messages.reverse(),
      pagination: {
        page, limit: PAGE_SIZE, total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNext: page * PAGE_SIZE < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};
