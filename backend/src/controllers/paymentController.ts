import { Request, Response } from 'express';
import Stripe from 'stripe';
import Doctor from '../models/Doctor';
import { IUser } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID as string,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/doctor/dashboard?subscribed=true`,
      cancel_url: `${process.env.CLIENT_URL}/doctor/subscription?cancelled=true`,
      metadata: { doctorId: doctor._id.toString() },
      customer_email: user.email,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear sesión de pago' });
  }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const doctorId = session.metadata?.doctorId;
        if (doctorId) {
          await Doctor.findByIdAndUpdate(doctorId, {
            isSubscribed: true,
            subscriptionId: session.subscription as string,
            subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isFeatured: true,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await Doctor.findOneAndUpdate(
          { subscriptionId: subscription.id },
          { isSubscribed: false, isFeatured: false, subscriptionId: undefined }
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await Doctor.findOneAndUpdate(
          { subscriptionId: (invoice as any).subscription },
          { isSubscribed: false, isFeatured: false }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ message: 'Webhook error' });
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const doctor = await Doctor.findOne({ userId: user._id }).select('isSubscribed subscriptionExpiresAt isFeatured');
    if (!doctor) { res.status(404).json({ message: 'Doctor no encontrado' }); return; }
    res.json({ doctor });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar suscripción' });
  }
};
