import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { RotateCcw, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Returns() {
  const { user, login } = useAuth();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({ reason: '', type: 'return', details: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      axios.get(`${API}/orders`, { withCredentials: true }),
      axios.get(`${API}/returns`, { withCredentials: true })
    ]).then(([oRes, rRes]) => {
      setOrders(oRes.data.orders || []);
      setReturns(rRes.data.returns || []);
    }).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center" data-testid="returns-login">
        <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
        <h1 className="font-serif text-3xl font-light text-foreground mb-3">Returns & Exchanges</h1>
        <p className="text-sm font-sans text-muted-foreground mb-8">Sign in to manage your returns.</p>
        <button onClick={login} className="bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em]">Sign in with Google</button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !form.reason) {
      toast.error('Please select an order and provide a reason'); return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/returns`, { order_id: selectedOrder.order_id, ...form }, { withCredentials: true });
      toast.success('Return request submitted successfully');
      setSelectedOrder(null);
      setForm({ reason: '', type: 'return', details: '' });
      const rRes = await axios.get(`${API}/returns`, { withCredentials: true });
      setReturns(rRes.data.returns || []);
    } catch (err) { toast.error('Failed to submit return request'); }
    finally { setSubmitting(false); }
  };

  const statusIcons = { pending: Clock, approved: CheckCircle, rejected: AlertCircle, completed: Package };

  return (
    <div className="py-12 lg:py-20" data-testid="returns-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-10">Returns & Exchanges</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* New Return Request */}
          <div>
            <h2 className="font-serif text-xl font-light text-foreground mb-6">New Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="return-form">
              <div>
                <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Select Order</label>
                <select value={selectedOrder?.order_id || ''} onChange={e => setSelectedOrder(orders.find(o => o.order_id === e.target.value))}
                  className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Choose an order</option>
                  {orders.map(o => (
                    <option key={o.order_id} value={o.order_id}>{o.order_number} - Rs {o.total?.toLocaleString('en-IN')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Type</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm(p => ({ ...p, type: 'return' }))}
                    className={`flex-1 py-2.5 text-xs font-sans uppercase tracking-wider border ${form.type === 'return' ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground'}`}>Return</button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, type: 'exchange' }))}
                    className={`flex-1 py-2.5 text-xs font-sans uppercase tracking-wider border ${form.type === 'exchange' ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground'}`}>Exchange</button>
                </div>
              </div>
              <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select reason</option>
                <option value="size">Wrong size / Doesn't fit</option>
                <option value="quality">Quality issue</option>
                <option value="wrong_item">Wrong item received</option>
                <option value="damaged">Damaged in transit</option>
                <option value="not_as_described">Not as described</option>
                <option value="changed_mind">Changed my mind</option>
              </select>
              <textarea placeholder="Additional details (optional)" rows={3} value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))}
                className="w-full bg-brand-surface border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              <button type="submit" disabled={submitting}
                className="w-full bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Existing Returns */}
          <div>
            <h2 className="font-serif text-xl font-light text-foreground mb-6">Your Requests</h2>
            {returns.length === 0 ? (
              <div className="text-center py-12 bg-brand-surface border border-brand-border">
                <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm font-sans text-muted-foreground">No return requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="returns-list">
                {returns.map(r => {
                  const StatusIcon = statusIcons[r.status] || Clock;
                  return (
                    <div key={r.return_id} className="bg-brand-surface border border-brand-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-sans font-medium text-foreground">{r.order_number}</span>
                        <span className={`flex items-center gap-1 text-xs font-sans uppercase tracking-wider ${r.status === 'approved' ? 'text-green-400' : r.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                          <StatusIcon className="w-3 h-3" /> {r.status}
                        </span>
                      </div>
                      <p className="text-xs font-sans text-muted-foreground capitalize">Type: {r.type} | Reason: {r.reason?.replace('_', ' ')}</p>
                      <p className="text-xs font-sans text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
