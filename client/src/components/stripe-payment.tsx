import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Smartphone, Banknote, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useStripe as useStripeContext } from '@/context/stripe-context';

interface StripePaymentProps {
  amount: number;
  orderId: string;
  customerEmail?: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
}

// Thai bank icons mapping
const BANK_ICONS: Record<string, string> = {
  scb: '🏦',
  ktb: '🏪',
  bbl: '💰',
  bay: '🏗️',
  ttb: '🏛️',
  gsb: '🏛️',
  tisco: '💼',
  kkp: '🏪',
  cimb: '🏦',
  uob: '💳',
  lhbank: '🏠',
  tbank: '💰',
};

const CheckoutForm: React.FC<{
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');
      onSuccess(paymentIntent);
    } else {
      setMessage('Payment processing...');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'promptpay'],
        }}
      />

      {message && (
        <Alert className={message.includes('succeeded') ? 'border-green-500' : 'border-red-500'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>
    </form>
  );
};

const ThaiBankingInfo: React.FC = () => {
  const [bankingOptions, setBankingOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankingOptions = async () => {
      try {
        const response = await fetch('/api/stripe/thai-banks');
        if (response.ok) {
          const data = await response.json();
          setBankingOptions(data);
        }
      } catch (error) {
        console.error('Error fetching Thai banking options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankingOptions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading banking options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Banknote className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="font-semibold text-green-800">Thai Banking Support</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {bankingOptions?.supportedBanks?.map((bank: string) => (
          <div key={bank} className="flex items-center p-2 bg-gray-50 rounded-lg">
            <span className="text-lg mr-2">{BANK_ICONS[bank] || '🏦'}</span>
            <span className="text-sm font-medium uppercase">{bank}</span>
            {bank === bankingOptions?.defaultBank && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Default
              </Badge>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center mb-2">
          <Smartphone className="h-4 w-4 text-blue-600 mr-2" />
          <span className="font-medium text-blue-800">PromptPay Available</span>
        </div>
        <p className="text-sm text-blue-700">
          Pay instantly using your Thai mobile banking app or QR code
        </p>
      </div>
    </div>
  );
};

export const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  orderId,
  customerEmail,
  onSuccess,
  onError,
}) => {
  const { clientSecret, isLoading, error, createPaymentIntent } = useStripeContext();
  const [paymentCreated, setPaymentCreated] = useState(false);

  useEffect(() => {
    if (!paymentCreated && !clientSecret && !isLoading) {
      createPaymentIntent(amount, orderId, customerEmail)
        .then(() => setPaymentCreated(true))
        .catch((err) => {
          console.error('Failed to create payment intent:', err);
          onError?.(err.message);
        });
    }
  }, [amount, orderId, customerEmail, clientSecret, isLoading, createPaymentIntent, paymentCreated, onError]);

  const handleSuccess = (paymentIntent: any) => {
    onSuccess?.(paymentIntent);
  };

  const handleError = (errorMessage: string) => {
    onError?.(errorMessage);
  };

  if (isLoading && !clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Preparing payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert className="border-red-500">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p>Unable to initialize payment. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
      },
    },
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Secure Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={useStripeContext().stripe} options={options}>
            <CheckoutForm onSuccess={handleSuccess} onError={handleError} />
          </Elements>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <ThaiBankingInfo />
        </CardContent>
      </Card>
    </div>
  );
};

export default StripePayment;
