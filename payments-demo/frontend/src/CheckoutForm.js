import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setPaymentStatus('');

    try {
      // Create payment intent
      const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10.00, // $10.00
          currency: 'usd'
        }),
      });

      const { client_secret, payment_intent_id } = await response.json();

      if (!client_secret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Test Customer',
          },
        }
      });

      if (error) {
        setMessage(`Payment failed: ${error.message}`);
        setPaymentStatus('failed');
      } else if (paymentIntent.status === 'succeeded') {
        setMessage('Payment succeeded! Check the backend logs and database.');
        setPaymentStatus('succeeded');
        console.log('Payment Intent:', paymentIntent);
      }

    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setPaymentStatus('failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="checkout-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="card-element">
            Credit or debit card
          </label>
          <CardElement
            id="card-element"
            options={CARD_ELEMENT_OPTIONS}
          />
        </div>

        <button 
          disabled={!stripe || isLoading} 
          className="pay-button"
          type="submit"
        >
          {isLoading ? 'Processing...' : 'Pay $10.00'}
        </button>

        {message && (
          <div className={`message ${paymentStatus}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
