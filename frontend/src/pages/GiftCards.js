import { useState } from 'react';
import axios from 'axios';
import { Gift, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GiftCards() {
  const [form, setForm] = useState({ amount: 5000, recipient_name: '', recipient_email: '', sender_name: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [purchased, setPurchased] = useState(null);
  const [checkCode, setCheckCode] = useState('');
  const [balance, setBalance] = useState(null);

  const amounts = [2000, 5000, 10000, 15000, 25000];

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!form.recipient_name || !form.recipient_email || !form.sender_name) {
      toast.error('Please fill in all required fields'); return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/giftcards/purchase`, form);
      setPurchased(res.data);
      toast.success('Gift card purchased!');
    } catch (err) { toast.error('Failed to purchase gift card'); }
    finally { setSubmitting(false); }
  };

  const handleCheck = async () => {
    if (!checkCode) return;
    try {
      const res = await axios.post(`${API}/giftcards/check`, { code: checkCode.toUpperCase() });
      setBalance(res.data);
    } catch (err) { toast.error(err.response?.data?.detail || 'Invalid gift card'); setBalance(null); }
  };

  return (
    <div className="py-12 lg:py-20" data-testid="giftcards-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Gift className="w-10 h-10 text-primary mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3">Gift Cards</h1>
          <p className="text-sm font-sans text-muted-foreground">The perfect gift for someone who appreciates fine craftsmanship.</p>
        </div>

        {purchased ? (
          <div className="max-w-md mx-auto text-center bg-brand-surface border border-brand-border p-8" data-testid="giftcard-success">
            <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-foreground mb-2">Gift Card Purchased!</h2>
            <p className="text-sm font-sans text-muted-foreground mb-4">Code: <span className="text-primary font-mono font-bold text-lg">{purchased.code}</span></p>
            <p className="text-sm font-sans text-muted-foreground">Amount: Rs {purchased.amount?.toLocaleString('en-IN')}</p>
            <p className="text-xs font-sans text-muted-foreground mt-2">Share this code with {purchased.recipient_name}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Purchase Form */}
            <div>
              <h2 className="font-serif text-xl font-light text-foreground mb-6">Purchase a Gift Card</h2>
              <form onSubmit={handlePurchase} className="space-y-4" data-testid="giftcard-form">
                <div>
                  <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Amount</label>
                  <div className="flex flex-wrap gap-2">
                    {amounts.map(a => (
                      <button key={a} type="button" onClick={() => setForm(p => ({ ...p, amount: a }))}
                        className={`px-4 py-2 text-sm font-sans border transition-all ${form.amount === a ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-foreground hover:border-primary'}`}>
                        Rs {a.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>
                <input type="text" placeholder="Recipient's name *" required value={form.recipient_name} onChange={e => setForm(p => ({ ...p, recipient_name: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="email" placeholder="Recipient's email *" required value={form.recipient_email} onChange={e => setForm(p => ({ ...p, recipient_email: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="text" placeholder="Your name *" required value={form.sender_name} onChange={e => setForm(p => ({ ...p, sender_name: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <textarea placeholder="Personal message (optional)" rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                <button type="submit" disabled={submitting}
                  className="w-full bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50" data-testid="giftcard-purchase-btn">
                  {submitting ? 'Processing...' : `Purchase - Rs ${form.amount.toLocaleString('en-IN')}`}
                </button>
              </form>
            </div>

            {/* Check Balance */}
            <div>
              <h2 className="font-serif text-xl font-light text-foreground mb-6">Check Balance</h2>
              <div className="bg-brand-surface border border-brand-border p-6 space-y-4" data-testid="giftcard-check">
                <input type="text" placeholder="Enter gift card code" value={checkCode} onChange={e => setCheckCode(e.target.value.toUpperCase())}
                  className="w-full bg-brand-bg border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase" />
                <button onClick={handleCheck} className="w-full border border-primary text-primary px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all">Check Balance</button>
                {balance && (
                  <div className="text-center pt-4 border-t border-brand-border">
                    <p className="text-sm font-sans text-muted-foreground">Available Balance</p>
                    <p className="font-serif text-3xl text-primary mt-1">Rs {balance.balance?.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
