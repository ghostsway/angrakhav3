import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, CreditCard, Smartphone, ShieldCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Checkout() {
  const { cart, subtotal, itemCount, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: '',
    address_line1: '', address_line2: '', city: '', state: '', pincode: '',
    payment_method: 'upi', coupon_code: ''
  });
  const [coupon, setCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cart.items || [];
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal >= 5000 ? 0 : 500;
  const discount = coupon ? coupon.discount_amount : 0;

  const applyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await axios.post(`${API}/coupons/validate`, {
        code: couponInput,
        order_total: subtotal + tax + shipping
      });
      setCoupon(res.data);
      setForm(p => ({ ...p, coupon_code: couponInput }));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid coupon code');
      setCoupon(null);
      setForm(p => ({ ...p, coupon_code: '' }));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setForm(p => ({ ...p, coupon_code: '' }));
    toast.info('Coupon removed');
  };

  const total = subtotal + tax + shipping - discount;

  const updateField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleCheckout = async () => {
    if (!form.name || !form.email || !form.phone || !form.address_line1 || !form.city || !form.state || !form.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!/^\+?[0-9]{10,15}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    if (!/^[1-9][0-9]{5}$/.test(form.pincode.replace(/\s/g, ''))) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    setSubmitting(true);
    try {
      // Mock payment
      const payRes = await axios.post(`${API}/payment/create-order`, { amount: total * 100 });
      await axios.post(`${API}/payment/verify`, { payment_id: payRes.data.order_id });

      // Create order
      const guestToken = localStorage.getItem('guest_token') || '';
      const headers = {};
      if (!user) headers['X-Guest-Token'] = guestToken;
      const res = await axios.post(`${API}/checkout`, form, { withCredentials: true, headers });
      
      // Redirect to order confirmation page
      navigate(`/order-confirmation/${res.data.order_number}`);
      
      fetchCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error('Checkout failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center" data-testid="checkout-empty">
        <p className="font-serif text-2xl text-foreground mb-4">Your cart is empty</p>
        <Link to="/collections" className="text-sm font-sans text-primary hover:underline">Browse collections</Link>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-20" data-testid="checkout-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-10">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Contact & Shipping */}
            <section className="space-y-4" data-testid="checkout-shipping">
              <h2 className="font-serif text-xl font-light text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground text-xs font-sans flex items-center justify-center">1</span>
                Contact & Shipping
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Full name *" required value={form.name} onChange={e => updateField('name', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-name" />
                <input type="email" placeholder="Email *" required value={form.email} onChange={e => updateField('email', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-email" />
              </div>
              <input type="tel" placeholder="Phone *" required value={form.phone} onChange={e => updateField('phone', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-phone" />
              <input type="text" placeholder="Address line 1 *" required value={form.address_line1} onChange={e => updateField('address_line1', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-address1" />
              <input type="text" placeholder="Address line 2 (optional)" value={form.address_line2} onChange={e => updateField('address_line2', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-address2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="City *" required value={form.city} onChange={e => updateField('city', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-city" />
                <input type="text" placeholder="State *" required value={form.state} onChange={e => updateField('state', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-state" />
                <input type="text" placeholder="Pincode *" required value={form.pincode} onChange={e => updateField('pincode', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="checkout-pincode" />
              </div>
            </section>

            {/* Step 2: Payment */}
            <section className="space-y-4" data-testid="checkout-payment">
              <h2 className="font-serif text-xl font-light text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-primary-foreground text-xs font-sans flex items-center justify-center">2</span>
                Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => updateField('payment_method', 'upi')}
                  className={`flex items-center gap-3 p-4 border transition-all ${form.payment_method === 'upi' ? 'border-primary bg-primary/10' : 'border-brand-border hover:border-primary/50'}`}
                  data-testid="payment-upi"
                >
                  <Smartphone className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-sans text-foreground font-medium">UPI</p>
                    <p className="text-xs font-sans text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                  </div>
                </button>
                <button
                  onClick={() => updateField('payment_method', 'card')}
                  className={`flex items-center gap-3 p-4 border transition-all ${form.payment_method === 'card' ? 'border-primary bg-primary/10' : 'border-brand-border hover:border-primary/50'}`}
                  data-testid="payment-card"
                >
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-sans text-foreground font-medium">Card</p>
                    <p className="text-xs font-sans text-muted-foreground">Credit or Debit Card</p>
                  </div>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground mt-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Payments are processed securely. Your data is encrypted.</span>
              </div>
            </section>

            {/* Place Order */}
            <button onClick={handleCheckout} disabled={submitting}
              className="w-full bg-primary text-primary-foreground px-8 py-4 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50"
              data-testid="place-order-btn">
              {submitting ? 'Processing...' : `Place Order - Rs ${total.toLocaleString('en-IN')}`}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-brand-surface border border-brand-border p-6 sticky top-28" data-testid="checkout-summary">
              <h2 className="font-serif text-xl font-light text-foreground mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.item_id} className="flex gap-3">
                    <div className="w-14 aspect-[3/4] bg-brand-bg shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-xs font-sans text-muted-foreground">Size: {item.size} | Qty: {item.quantity}</p>
                      <p className="text-sm font-sans text-primary mt-0.5">Rs {(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Coupon Section */}
              <div className="border-t border-brand-border pt-4 mt-4">
                <h3 className="font-sans text-sm font-medium text-foreground mb-3">Have a Coupon?</h3>
                {!coupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-brand-surface border border-brand-border px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon}
                      className="bg-primary text-white px-4 py-2 text-sm font-sans uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">{coupon.code} Applied!</p>
                      <p className="text-xs text-green-600">You saved ₹{coupon.discount_amount.toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-sm font-sans border-t border-brand-border pt-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">Rs {subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span className="text-foreground">Rs {tax.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{shipping === 0 ? 'Free' : `Rs ${shipping}`}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({coupon.code})</span>
                    <span>- Rs {discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-brand-border pt-2 mt-2">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-serif text-lg text-primary">Rs {total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
