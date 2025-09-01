import Stripe from 'stripe';
import { prismaStorage } from './storage';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-08-27.basil' as any,
});

export interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface ThaiBankingOptions {
  // Thai banks supported by Stripe
  supportedBanks: string[];
  defaultBank: string;
}

// Thai banks supported by Stripe in Thailand
export const THAI_BANKING_OPTIONS: ThaiBankingOptions = {
  supportedBanks: [
    'scb', // Siam Commercial Bank
    'ktb', // Krung Thai Bank
    'bbl', // Bangkok Bank
    'bay', // Bank of Ayudhya
    'ttb', // TMBThanachart Bank
    'gsb', // Government Savings Bank
    'tisco', // Tisco Bank
    'kkp', // Kiatnakin Bank
    'cimb', // CIMB Thai Bank
    'uob', // United Overseas Bank (Thai)
    'lhbank', // Land and Houses Bank
    'tbank', // Thanachart Bank
  ],
  defaultBank: 'scb'
};

export class StripeService {
  /**
   * Create a PaymentIntent for Thai banking
   */
  static async createPaymentIntent(data: CreatePaymentIntentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to satang (THB smallest unit)
        currency: data.currency || 'thb',
        payment_method_types: ['card', 'promptpay'], // Support both card and PromptPay
        metadata: {
          orderId: data.orderId,
          ...data.metadata,
        },
        description: `Order #${data.orderId}`,
        receipt_email: data.customerEmail,
        // Enable automatic payment methods for better UX
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm a PaymentIntent
   */
  static async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw new Error('Failed to confirm payment intent');
    }
  }

  /**
   * Create a PaymentIntent with Thai banking options
   */
  static async createThaiPaymentIntent(data: CreatePaymentIntentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // THB to satang
        currency: 'thb',
        payment_method_types: ['card', 'promptpay'],
        payment_method_options: {
          promptpay: {
            setup_future_usage: 'none' as any,
          },
        },
        metadata: {
          orderId: data.orderId,
          paymentType: 'thai_banking',
          ...data.metadata,
        },
        description: `Thai Payment - Order #${data.orderId}`,
        receipt_email: data.customerEmail,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        supportedBanks: THAI_BANKING_OPTIONS.supportedBanks,
        defaultBank: THAI_BANKING_OPTIONS.defaultBank,
      };
    } catch (error) {
      console.error('Error creating Thai payment intent:', error);
      throw new Error('Failed to create Thai payment intent');
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  static async handleWebhook(rawBody: Buffer, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret!);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.handlePaymentSuccess(paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await this.handlePaymentFailure(failedPayment);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      try {
        // Update order status in database
        // TODO: Implement order status update
        // await prismaStorage.updateOrderStatus(orderId, 'paid');
        console.log(`Order ${orderId} marked as paid`);
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      try {
        // Update order status to failed
        // TODO: Implement order status update
        // await prismaStorage.updateOrderStatus(orderId, 'failed');
        console.log(`Order ${orderId} marked as failed`);
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  }

  /**
   * Get payment methods for Thai customer
   */
  static async getThaiPaymentMethods(customerId?: string) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  /**
   * Create or retrieve a Stripe customer
   */
  static async createOrRetrieveCustomer(email: string, name?: string) {
    try {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          source: 'cognitosphere_thai_market'
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      throw new Error('Failed to create customer');
    }
  }
}

export default StripeService;
