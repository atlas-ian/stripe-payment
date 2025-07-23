import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import './App.css';

const stripePromise = loadStripe(process.env.REACT_APP_PUBLISHABLE_KEY);

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'Ideal Sans, system-ui, sans-serif',
    spacingUnit: '2px',
    borderRadius: '4px',
  }
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Payment Processing Demo</h1>
        <p>Test Stripe integration with PaymentIntent</p>
      </header>
      
      <main className="App-main">
        <Elements stripe={stripePromise} options={{ appearance }}>
          <CheckoutForm />
        </Elements>
      </main>
      
      <footer className="App-footer">
        <p>
          Use test card: <strong>4242 4242 4242 4242</strong><br/>
          Any future expiry date and any 3-digit CVC
        </p>
      </footer>
    </div>
  );
}

export default App;
