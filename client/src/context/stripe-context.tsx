import React, { createContext, useContext, useState, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface StripeContextType {
  stripe: Stripe | null;
  clientSecret: string | null;
  paymentIntentId: string | null;
  isLoading: boolean;
  error: string | null;
  stripeError: string | null;
  createPaymentIntent: (amount: number, orderId: string, customerEmail?: string) => Promise<void>;
  confirmPayment: (paymentIntentId: string) => Promise<any>;
  clearError: () => void;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

// Initialize Stripe with your publishable key and retry logic
const createStripePromise = () => {
  return loadStripe('pk_test_51QIZofF7DfJ06Q5YSGFnY0UX1XmARByEJfZOmmKQbQMI4vrnTsGFrdEWdJHmoqWx0CBCminY2tqD9NjUDH9zWPa5002BJsMknT');
};

const stripePromise = createStripePromise();

export const StripeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Initialize Stripe on mount with better error handling and retry logic
  React.useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadStripeWithRetry = async () => {
      try {
        console.log(`🔄 Attempting to load Stripe.js (attempt ${retryCount + 1}/${maxRetries})`);
        
        const stripeInstance = await stripePromise;
        
        if (stripeInstance) {
          setStripe(stripeInstance);
          setStripeError(null);
          console.log('✅ Stripe.js loaded successfully');
        } else {
          throw new Error('Stripe instance is null');
        }
      } catch (err) {
        retryCount++;
        console.error(`❌ Stripe.js load attempt ${retryCount} failed:`, err);
        
        if (retryCount < maxRetries) {
          // Wait 2 seconds before retrying
          setTimeout(() => {
            console.log(`🔄 Retrying Stripe.js load in 2 seconds...`);
            loadStripeWithRetry();
          }, 2000);
        } else {
          setStripeError('Failed to load Stripe.js library after multiple attempts');
          console.error('❌ Stripe.js failed to load after all retry attempts');
        }
      }
    };
    
    loadStripeWithRetry();
  }, []);

  const createPaymentIntent = async (amount: number, orderId: string, customerEmail?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          orderId,
          customerEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async (paymentIntentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stripe/confirm-payment/${paymentIntentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm payment');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: StripeContextType = {
    stripe,
    clientSecret,
    paymentIntentId,
    isLoading,
    error,
    stripeError,
    createPaymentIntent,
    confirmPayment,
    clearError,
  };

  // Show error message if Stripe fails to load
  if (stripeError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment System Unavailable</h2>
            <p className="text-gray-600 mb-4">
              We're experiencing issues with our payment system. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <div className="mt-4 text-xs text-gray-500">
              Error: {stripeError}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};
