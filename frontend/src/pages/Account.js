import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { User, Package, MapPin, LogOut, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Account() {
  const { user, login, logout, loading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/addresses')) setActiveTab('addresses');
    else if (path.includes('/returns')) setActiveTab('returns');
    else setActiveTab('orders');
  }, [location]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', phone: user.phone || '' });
    setLoadingOrders(true);
    Promise.all([
      axios.get(`${API}/orders`, { withCredentials: true }),
      axios.get(`${API}/addresses`, { withCredentials: true }),
      axios.get(`${API}/returns`, { withCredentials: true })
    ]).then(([oRes, aRes, rRes]) => {
      setOrders(oRes.data.orders || []);
      setAddresses(aRes.data.addresses || []);
      setReturns(rRes.data.returns || []);
    }).catch(() => {}).finally(() => setLoadingOrders(false));
  }, [user]);

  if (authLoading) return <div className="py-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (!user) return (
    <div className="py-20 text-center" data-testid="account-login-prompt">
      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
      <h1 className="font-serif text-3xl font-light text-foreground mb-3">Welcome</h1>
      <p className="text-sm font-sans text-muted-foreground mb-8">Sign in to view your orders, wishlist and account details.</p>
      <button onClick={login} className="bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em]" data-testid="account-login-btn">Sign in with Google</button>
    </div>
  );

  const handleLogout = async () => { await logout(); navigate('/'); toast.success('Logged out successfully'); };

  const handleProfileUpdate = async () => {
    try {
      await axios.put(`${API}/profile`, profileForm, { withCredentials: true });
      toast.success('Profile updated');
      setEditProfile(false);
      await checkAuth();
    } catch { toast.error('Failed to update profile'); }
  };

  const handleReorder = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/reorder`, {}, { withCredentials: true });
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch { toast.error('Failed to reorder'); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/addresses`, addressForm, { withCredentials: true });
      setAddresses(prev => [...prev, res.data]);
      setShowAddressForm(false);
      setAddressForm({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false });
      toast.success('Address added');
    } catch { toast.error('Failed to add address'); }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await axios.delete(`${API}/addresses/${id}`, { withCredentials: true });
      setAddresses(prev => prev.filter(a => a.address_id !== id));
      toast.success('Address removed');
    } catch { toast.error('Failed to delete address'); }
  };

  const tabs = [
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'returns', label: 'Returns', icon: RotateCcw },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="py-12 lg:py-20" data-testid="account-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            {user.picture ? <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full object-cover" /> : (
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-serif text-xl">{user.name?.[0] || 'U'}</div>
            )}
            <div>
              <h1 className="font-serif text-2xl font-light text-foreground">{user.name}</h1>
              <p className="text-sm font-sans text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors" data-testid="logout-btn">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto border-b border-brand-border mb-8 pb-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-xs font-sans uppercase tracking-[0.2em] transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === t.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid={`tab-${t.key}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div data-testid="orders-list">
            {loadingOrders ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-brand-surface animate-pulse" />)}</div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.order_id} className="border border-brand-border p-5 bg-brand-surface" data-testid={`order-${order.order_id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm font-sans font-medium text-foreground">{order.order_number}</p>
                        <p className="text-xs font-sans text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-sans uppercase tracking-widest px-2 py-1 ${order.status === 'confirmed' ? 'bg-green-900/30 text-green-400' : order.status === 'delivered' ? 'bg-blue-900/30 text-blue-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{order.status}</span>
                        <span className="font-serif text-lg text-primary">Rs {order.total?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto mb-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="w-14 aspect-[3/4] bg-brand-bg shrink-0 overflow-hidden"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReorder(order.order_id)} className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider text-primary border border-primary px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-all" data-testid={`reorder-${order.order_id}`}>
                        <RefreshCw className="w-3 h-3" /> Reorder
                      </button>
                      <Link to={`/order-confirmation/${order.order_number}`} className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider text-muted-foreground border border-brand-border px-3 py-1.5 hover:text-foreground transition-all">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><Package className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} /><p className="font-serif text-xl text-foreground mb-2">No orders yet</p></div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div data-testid="addresses-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-light text-foreground">Saved Addresses</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-xs font-sans uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-all" data-testid="add-address-btn">
                {showAddressForm ? 'Cancel' : 'Add Address'}
              </button>
            </div>
            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="bg-brand-surface border border-brand-border p-6 mb-6 space-y-4" data-testid="address-form">
                <div className="grid grid-cols-2 gap-4">
                  <select value={addressForm.label} onChange={e => setAddressForm(p => ({ ...p, label: e.target.value }))} className="bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
                  </select>
                  <input type="text" placeholder="Full name *" required value={addressForm.name} onChange={e => setAddressForm(p => ({ ...p, name: e.target.value }))} className="bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <input type="tel" placeholder="Phone *" required value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="text" placeholder="Address line 1 *" required value={addressForm.line1} onChange={e => setAddressForm(p => ({ ...p, line1: e.target.value }))} className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="text" placeholder="Address line 2" value={addressForm.line2} onChange={e => setAddressForm(p => ({ ...p, line2: e.target.value }))} className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="City *" required value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} className="bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="text" placeholder="State *" required value={addressForm.state} onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))} className="bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="text" placeholder="Pincode *" required value={addressForm.pincode} onChange={e => setAddressForm(p => ({ ...p, pincode: e.target.value }))} className="bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <label className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                  <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(p => ({ ...p, is_default: e.target.checked }))} className="accent-primary" /> Set as default
                </label>
                <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-sans uppercase tracking-[0.2em]">Save Address</button>
              </form>
            )}
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(a => (
                  <div key={a.address_id} className="bg-brand-surface border border-brand-border p-5 relative" data-testid={`address-${a.address_id}`}>
                    {a.is_default && <span className="absolute top-3 right-3 text-[10px] font-sans uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5">Default</span>}
                    <p className="text-xs font-sans uppercase tracking-wider text-primary mb-2">{a.label}</p>
                    <p className="text-sm font-sans text-foreground font-medium">{a.name}</p>
                    <p className="text-sm font-sans text-muted-foreground mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                    <p className="text-sm font-sans text-muted-foreground">{a.city}, {a.state} - {a.pincode}</p>
                    <p className="text-sm font-sans text-muted-foreground">{a.phone}</p>
                    <button onClick={() => handleDeleteAddress(a.address_id)} className="mt-3 text-xs font-sans text-red-400 hover:text-red-300 transition-colors">Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} /><p className="text-sm font-sans text-muted-foreground">No saved addresses. Add one for faster checkout.</p></div>
            )}
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && (
          <div data-testid="returns-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-light text-foreground">Return Requests</h2>
              <Link to="/returns" className="text-xs font-sans uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-all">New Request</Link>
            </div>
            {returns.length > 0 ? (
              <div className="space-y-3">
                {returns.map(r => (
                  <div key={r.return_id} className="bg-brand-surface border border-brand-border p-4 flex items-center justify-between">
                    <div><p className="text-sm font-sans text-foreground">{r.order_number}</p><p className="text-xs font-sans text-muted-foreground capitalize">{r.type} - {r.reason?.replace('_', ' ')}</p></div>
                    <span className={`text-xs font-sans uppercase tracking-wider px-2 py-1 ${r.status === 'approved' ? 'bg-green-900/30 text-green-400' : r.status === 'rejected' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><RotateCcw className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} /><p className="text-sm font-sans text-muted-foreground">No return requests.</p></div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-lg space-y-6" data-testid="profile-section">
            <div className="bg-brand-surface border border-brand-border p-6 space-y-4">
              {editProfile ? (
                <div className="space-y-4">
                  <div><label className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1 block">Name</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="profile-name-input" /></div>
                  <div><label className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1 block">Phone</label>
                    <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-brand-bg border border-brand-border px-3 py-2.5 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="profile-phone-input" /></div>
                  <div className="flex gap-3">
                    <button onClick={handleProfileUpdate} className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-sans uppercase tracking-[0.2em]" data-testid="profile-save">Save</button>
                    <button onClick={() => setEditProfile(false)} className="border border-brand-border text-muted-foreground px-6 py-2.5 text-xs font-sans uppercase tracking-[0.2em]">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div><p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1">Name</p><p className="text-sm font-sans text-foreground">{user.name}</p></div>
                  <div><p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1">Email</p><p className="text-sm font-sans text-foreground">{user.email}</p></div>
                  <div><p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1">Phone</p><p className="text-sm font-sans text-foreground">{user.phone || 'Not set'}</p></div>
                  <div><p className="text-xs font-sans uppercase tracking-[0.2em] text-muted-foreground mb-1">Member Since</p><p className="text-sm font-sans text-foreground">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'Recently joined'}</p></div>
                  <button onClick={() => setEditProfile(true)} className="text-xs font-sans uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-all" data-testid="profile-edit-btn">Edit Profile</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
