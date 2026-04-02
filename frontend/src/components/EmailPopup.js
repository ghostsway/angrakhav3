import { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EmailPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('email_popup_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShow(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/newsletter`, { email });
      toast.success('Welcome! Check your inbox for your 10% discount code.');
      localStorage.setItem('email_popup_dismissed', 'true');
      setShow(false);
    } catch { toast.error('Failed to subscribe. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const dismiss = () => {
    localStorage.setItem('email_popup_dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" data-testid="email-popup-overlay">
      <div className="bg-brand-bg border border-brand-border max-w-md w-full p-8 relative" data-testid="email-popup">
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors" data-testid="email-popup-close">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <Gift className="w-10 h-10 text-primary mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-serif text-2xl font-light text-foreground mb-2">Get 10% Off</h2>
          <p className="text-sm font-sans text-muted-foreground mb-6">Subscribe to our newsletter and get 10% off your first order.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="email-popup-input" />
            <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50" data-testid="email-popup-submit">
              {submitting ? 'Subscribing...' : 'Get My 10% Off'}
            </button>
          </form>
          <button onClick={dismiss} className="mt-4 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">No thanks, I'll pay full price</button>
        </div>
      </div>
    </div>
  );
}
