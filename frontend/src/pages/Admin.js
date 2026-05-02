import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  BarChart3, Package, ShoppingCart, Users, Mail, FileText, LayoutGrid,
  Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, X, Search,
  IndianRupee, TrendingUp, ShoppingBag, MessageSquare, Newspaper,
  Check, Truck, XCircle, RefreshCw, Tag, Warehouse, RotateCcw, Gift, UserPlus, AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'collections', label: 'Collections', icon: LayoutGrid },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'abandoned', label: 'Abandoned Carts', icon: AlertTriangle },
  { id: 'giftcards', label: 'Gift Cards', icon: Gift },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'newsletter', label: 'Newsletter', icon: Newspaper },
  { id: 'cms', label: 'CMS', icon: FileText },
];

const CATEGORIES = ['sherwani', 'kurta', 'bandhgala', 'jodhpuri', 'nehru_jacket', 'festive_set'];
const OCCASIONS = ['wedding', 'festive', 'casual'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const FITS = ['Slim', 'Regular', 'Tailored', 'Relaxed'];
const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-brand-surface border border-brand-border p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>
      <p className="font-serif text-2xl font-light text-foreground">{value}</p>
      {sub && <p className="text-xs font-sans text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function DashboardTab({ analytics }) {
  if (!analytics) return <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>;
  const a = analytics;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue" value={`Rs ${(a.total_revenue || 0).toLocaleString('en-IN')}`} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={a.total_orders || 0} sub={`Avg Rs ${(a.avg_order_value || 0).toLocaleString('en-IN')}`} />
        <StatCard icon={Users} label="Customers" value={a.total_customers || 0} />
        <StatCard icon={MessageSquare} label="Enquiries" value={a.total_enquiries || 0} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products" value={a.total_products || 0} />
        <StatCard icon={Newspaper} label="Subscribers" value={a.total_subscribers || 0} />
        <StatCard icon={Check} label="Confirmed" value={a.order_status?.confirmed || 0} />
        <StatCard icon={Truck} label="Shipped" value={a.order_status?.shipped || 0} />
      </div>
      {a.monthly_revenue?.length > 0 && (
        <div className="bg-brand-surface border border-brand-border p-6">
          <h3 className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={a.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(14,10%,25%)" />
              <XAxis dataKey="month" tick={{ fill: '#b3aaa0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#b3aaa0', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#282422', border: '1px solid #3a322f', color: '#f6f3ed', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#C4A36B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {a.top_products?.length > 0 && (
          <div className="bg-brand-surface border border-brand-border p-6">
            <h3 className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-4">Top Products</h3>
            <div className="space-y-3">
              {a.top_products.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm font-sans">
                  <span className="text-foreground truncate mr-2">{p.name || 'Unknown'}</span>
                  <span className="text-primary shrink-0">Rs {p.revenue?.toLocaleString('en-IN')} ({p.count} sold)</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {a.recent_orders?.length > 0 && (
          <div className="bg-brand-surface border border-brand-border p-6">
            <h3 className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {a.recent_orders.slice(0, 5).map(o => (
                <div key={o.order_id} className="flex items-center justify-between text-sm font-sans">
                  <div>
                    <span className="text-foreground">{o.order_number}</span>
                    <span className="text-muted-foreground ml-2">- {o.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <span className="text-primary">Rs {o.total?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    confirmed: 'bg-green-900/30 text-green-400',
    processing: 'bg-blue-900/30 text-blue-400',
    shipped: 'bg-yellow-900/30 text-yellow-400',
    delivered: 'bg-emerald-900/30 text-emerald-400',
    cancelled: 'bg-red-900/30 text-red-400',
    refunded: 'bg-purple-900/30 text-purple-400',
    new: 'bg-blue-900/30 text-blue-400',
    reviewed: 'bg-gray-700/30 text-gray-400',
  };
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${colors[status] || 'bg-brand-border text-muted-foreground'}`}>
      {status}
    </span>
  );
}

function ProductForm({ product, onSave, onClose }) {
  const [form, setForm] = useState(product || {
    name: '', slug: '', short_description: '', description: '',
    price: 0, compare_price: 0, images: [''], category: 'kurta',
    fabric: '', color: '', fit: 'Regular', occasions: [], sizes: [],
    tags: [], in_stock: true, featured: false, care: '', lining: ''
  });
  const [saving, setSaving] = useState(false);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleArray = (key, val) => {
    const arr = form[key] || [];
    u(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Product name is required'); return; }
    if (!form.price || form.price <= 0) { toast.error('Valid price is required'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); } catch (e) { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-brand-bg border border-brand-border w-full max-w-3xl mb-10 z-10">
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <h2 className="font-serif text-xl text-foreground">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Name *</label>
              <input value={form.name} onChange={e => { u('name', e.target.value); if (!product) u('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Slug</label>
              <input value={form.slug} onChange={e => u('slug', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Short Description</label>
            <input value={form.short_description} onChange={e => u('short_description', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Full Description</label>
            <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={3}
              className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Price (Rs) *</label>
              <input type="number" value={form.price} onChange={e => u('price', Number(e.target.value))}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Compare Price</label>
              <input type="number" value={form.compare_price} onChange={e => u('compare_price', Number(e.target.value))}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e => u('category', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Fit</label>
              <select value={form.fit} onChange={e => u('fit', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {FITS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Fabric</label>
              <input value={form.fabric} onChange={e => u('fabric', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Color</label>
              <input value={form.color} onChange={e => u('color', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Image URLs</label>
            {(form.images || ['']).map((img, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={img} onChange={e => { const imgs = [...(form.images || [''])]; imgs[i] = e.target.value; u('images', imgs); }}
                  placeholder="https://..." className="flex-1 bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                {(form.images || []).length > 1 && (
                  <button onClick={() => u('images', form.images.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive px-2"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button onClick={() => u('images', [...(form.images || []), ''])} className="text-xs font-sans text-primary hover:underline">+ Add image</button>
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Occasions</label>
            <div className="flex gap-2 flex-wrap">
              {OCCASIONS.map(o => (
                <button key={o} onClick={() => toggleArray('occasions', o)} type="button"
                  className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-all ${(form.occasions || []).includes(o) ? 'border-primary bg-primary/20 text-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}>{o}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Available Sizes</label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(s => (
                <button key={s} onClick={() => toggleArray('sizes', s)} type="button"
                  className={`min-w-[40px] h-8 px-2 text-xs border transition-all ${(form.sizes || []).includes(s) ? 'border-primary bg-primary text-primary-foreground' : 'border-brand-border text-muted-foreground hover:border-primary'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Tags (comma separated)</label>
            <input value={(form.tags || []).join(', ')} onChange={e => u('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="wedding, bestseller, new" className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Care Instructions</label>
              <input value={form.care} onChange={e => u('care', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Lining</label>
              <input value={form.lining} onChange={e => u('lining', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.in_stock} onChange={e => u('in_stock', e.target.checked)} className="accent-brand-gold" />
              <span className="text-sm font-sans text-foreground">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => u('featured', e.target.checked)} className="accent-brand-gold" />
              <span className="text-sm font-sans text-foreground">Featured</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-brand-border">
          <button onClick={onClose} className="px-6 py-2.5 text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground border border-brand-border hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 text-xs font-sans uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/products?page=${p}&q=${encodeURIComponent(q)}`, { withCredentials: true });
      setProducts(res.data.products); setTotal(res.data.total); setPage(p);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (form) => {
    if (form.product_id) {
      await axios.put(`${API}/admin/products/${form.product_id}`, form, { withCredentials: true });
      toast.success('Product updated');
    } else {
      await axios.post(`${API}/admin/products`, form, { withCredentials: true });
      toast.success('Product created');
    }
    fetchProducts(page, search);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await axios.delete(`${API}/admin/products/${id}`, { withCredentials: true });
    toast.success('Product deleted');
    fetchProducts(page, search);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center bg-brand-surface border border-brand-border flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground ml-3" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts(1, search)}
              placeholder="Search products..." className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none" />
          </div>
          <span className="text-xs text-muted-foreground">{total} total</span>
        </div>
        <button onClick={() => setEditing({})}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-primary/90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>
      <div className="border border-brand-border overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Category</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Price</th>
              <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Stock</th>
              <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Featured</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-brand-border/50"><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-brand-surface animate-pulse rounded w-full" /></td></tr>
              ))
            ) : products.map(p => (
              <tr key={p.product_id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-12 object-cover bg-brand-surface shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-foreground truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{p.category?.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right text-primary">Rs {p.price?.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-center">{p.in_stock ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}</td>
                <td className="px-4 py-3 text-center">{p.featured ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => window.open(`/products/${p.slug}`, '_blank')} className="p-1.5 text-muted-foreground hover:text-foreground"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditing(p)} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(p.product_id, p.name)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => fetchProducts(page - 1, search)} disabled={page <= 1} className="p-2 border border-brand-border text-muted-foreground disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-4 py-2 text-sm text-muted-foreground">Page {page}</span>
          <button onClick={() => fetchProducts(page + 1, search)} disabled={products.length < 20} className="p-2 border border-brand-border text-muted-foreground disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
      {editing !== null && <ProductForm product={editing.product_id ? editing : null} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchOrders = useCallback(async (status = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/orders?status=${status}&limit=50`, { withCredentials: true });
      setOrders(res.data.orders);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    await axios.put(`${API}/admin/orders/${orderId}`, { status }, { withCredentials: true });
    toast.success(`Order marked as ${status}`);
    fetchOrders(filter);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => { setFilter(s); fetchOrders(s); }}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-all ${filter === s ? 'border-primary bg-primary/20 text-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}>{s || 'All'}</button>
        ))}
      </div>
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-brand-surface animate-pulse" />)
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No orders found</p>
        ) : orders.map(o => (
          <div key={o.order_id} className="bg-brand-surface border border-brand-border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-sans font-medium text-foreground">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{o.customer_name} - {o.guest_email} - {new Date(o.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.status} />
                <span className="font-serif text-lg text-primary">Rs {o.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-2">Update:</span>
              {ORDER_STATUSES.filter(s => s !== o.status).map(s => (
                <button key={s} onClick={() => updateStatus(o.order_id, s)}
                  className="px-2 py-1 text-[10px] uppercase tracking-widest border border-brand-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">{s}</button>
              ))}
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {o.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-brand-bg px-2 py-1 text-xs text-muted-foreground shrink-0">
                  {item.image && <img src={item.image} alt="" className="w-6 h-8 object-cover" />}
                  <span>{item.name} x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', hero_image: '', occasion_tags: [], featured: false, sort_order: 99 });

  const fetchCollections = async () => {
    const res = await axios.get(`${API}/admin/collections`, { withCredentials: true });
    setCollections(res.data.collections || []);
  };

  useEffect(() => { fetchCollections(); }, []);

  const openEdit = (col) => {
    setEditing(col.collection_id);
    setForm({ name: col.name, slug: col.slug, description: col.description || '', hero_image: col.hero_image || '', occasion_tags: col.occasion_tags || [], featured: col.featured || false, sort_order: col.sort_order || 99 });
  };

  const openNew = () => {
    setEditing('new');
    setForm({ name: '', slug: '', description: '', hero_image: '', occasion_tags: [], featured: false, sort_order: 99 });
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    try {
      if (editing === 'new') {
        await axios.post(`${API}/admin/collections`, form, { withCredentials: true });
        toast.success('Collection created');
      } else {
        await axios.put(`${API}/admin/collections/${editing}`, form, { withCredentials: true });
        toast.success('Collection updated');
      }
      setEditing(null);
      fetchCollections();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await axios.delete(`${API}/admin/collections/${id}`, { withCredentials: true });
    toast.success('Deleted');
    fetchCollections();
  };

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-primary/90">
          <Plus className="w-3.5 h-3.5" /> Add Collection
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(col => (
          <div key={col.collection_id} className="bg-brand-surface border border-brand-border overflow-hidden">
            {col.hero_image && <img src={col.hero_image} alt={col.name} className="w-full h-32 object-cover" />}
            <div className="p-4">
              <p className="font-serif text-foreground">{col.name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{col.description}</p>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => openEdit(col)} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(col.collection_id, col.name)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative bg-brand-bg border border-brand-border w-full max-w-lg z-10">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h2 className="font-serif text-xl text-foreground">{editing === 'new' ? 'New Collection' : 'Edit Collection'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => { u('name', e.target.value); if (editing === 'new') u('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Slug</label>
                  <input value={form.slug} onChange={e => u('slug', e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={2}
                  className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Hero Image URL</label>
                <input value={form.hero_image} onChange={e => u('hero_image', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => u('sort_order', Number(e.target.value))}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => u('featured', e.target.checked)} className="accent-brand-gold" />
                    <span className="text-sm font-sans text-foreground">Featured</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-brand-border">
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 text-xs uppercase tracking-widest text-muted-foreground border border-brand-border hover:text-foreground">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: 10, min_order: 0, max_discount: '', expiry_date: '', usage_limit: '', active: true });

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API}/admin/coupons`, { withCredentials: true });
      setCoupons(res.data.coupons || []);
    } catch {}
  };

  useEffect(() => { fetchCoupons(); }, []);

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.code) { toast.error('Code required'); return; }
    try {
      const payload = { ...form, code: form.code.toUpperCase(), discount_value: Number(form.discount_value), min_order: Number(form.min_order), max_discount: form.max_discount ? Number(form.max_discount) : null, usage_limit: form.usage_limit ? Number(form.usage_limit) : null, expiry_date: form.expiry_date || null };
      if (editing === 'new') {
        await axios.post(`${API}/admin/coupons`, payload, { withCredentials: true });
        toast.success('Coupon created');
      } else {
        await axios.put(`${API}/admin/coupons/${editing}`, payload, { withCredentials: true });
        toast.success('Coupon updated');
      }
      setEditing(null);
      fetchCoupons();
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete coupon?')) return;
    await axios.delete(`${API}/admin/coupons/${id}`, { withCredentials: true });
    toast.success('Deleted');
    fetchCoupons();
  };

  const openEdit = (c) => {
    setEditing(c.coupon_id);
    setForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order: c.min_order || 0, max_discount: c.max_discount || '', expiry_date: c.expiry_date ? c.expiry_date.slice(0, 10) : '', usage_limit: c.usage_limit || '', active: c.active });
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => { setEditing('new'); setForm({ code: '', discount_type: 'percentage', discount_value: 10, min_order: 0, max_discount: '', expiry_date: '', usage_limit: '', active: true }); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-primary/90">
          <Plus className="w-3.5 h-3.5" /> Add Coupon
        </button>
      </div>
      <div className="border border-brand-border overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Discount</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Min Order</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Used</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Expiry</th>
              <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Active</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.coupon_id} className="border-b border-brand-border/50 hover:bg-brand-surface/50">
                <td className="px-4 py-3 font-mono text-primary font-medium">{c.code}</td>
                <td className="px-4 py-3 text-foreground">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `Rs ${c.discount_value}`}{c.max_discount ? ` (max Rs ${c.max_discount})` : ''}</td>
                <td className="px-4 py-3 text-muted-foreground">Rs {c.min_order}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.times_used || 0}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                <td className="px-4 py-3 text-center">{c.active ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c.coupon_id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative bg-brand-bg border border-brand-border w-full max-w-md z-10">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h2 className="font-serif text-xl text-foreground">{editing === 'new' ? 'New Coupon' : 'Edit Coupon'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Code *</label>
                  <input value={form.code} onChange={e => u('code', e.target.value.toUpperCase())}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Type</label>
                  <select value={form.discount_type} onChange={e => u('discount_type', e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (Rs)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Value *</label>
                  <input type="number" value={form.discount_value} onChange={e => u('discount_value', e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Max Discount (Rs)</label>
                  <input type="number" value={form.max_discount} onChange={e => u('max_discount', e.target.value)} placeholder="Optional"
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Min Order (Rs)</label>
                  <input type="number" value={form.min_order} onChange={e => u('min_order', e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={e => u('usage_limit', e.target.value)} placeholder="Unlimited"
                    className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Expiry Date</label>
                <input type="date" value={form.expiry_date} onChange={e => u('expiry_date', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => u('active', e.target.checked)} className="accent-brand-gold" />
                <span className="text-sm font-sans text-foreground">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-brand-border">
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 text-xs uppercase tracking-widest text-muted-foreground border border-brand-border hover:text-foreground">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnquiriesTab() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/enquiries`, { withCredentials: true })
      .then(r => setEnquiries(r.data.enquiries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markReviewed = async (id) => {
    await axios.put(`${API}/admin/enquiries/${id}`, { status: 'reviewed' }, { withCredentials: true });
    setEnquiries(prev => prev.map(e => e.enquiry_id === id ? { ...e, status: 'reviewed' } : e));
    toast.success('Marked as reviewed');
  };

  return (
    <div className="space-y-4">
      {loading ? <div className="text-muted-foreground text-center py-8">Loading...</div>
        : enquiries.length === 0 ? <div className="text-muted-foreground text-center py-8">No enquiries</div>
        : enquiries.map(e => (
          <div key={e.enquiry_id} className="bg-brand-surface border border-brand-border p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-sans font-medium text-foreground">{e.name} <span className="text-muted-foreground font-normal text-xs ml-2">{e.phone}</span></p>
                <p className="text-xs text-muted-foreground">{e.email} · {e.occasion} · {new Date(e.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>
            <p className="text-sm text-foreground/80 mt-1">{e.message}</p>
            {e.status === 'new' && (
              <button onClick={() => markReviewed(e.enquiry_id)} className="mt-3 text-xs uppercase tracking-widest border border-brand-border text-muted-foreground hover:text-primary hover:border-primary px-3 py-1.5 transition-colors">Mark Reviewed</button>
            )}
          </div>
        ))}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/customers`, { withCredentials: true })
      .then(r => setCustomers(r.data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border border-brand-border overflow-x-auto">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-brand-border bg-brand-surface">
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Customer</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Joined</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => <tr key={i}><td colSpan={3} className="px-4 py-4"><div className="h-4 bg-brand-surface animate-pulse rounded" /></td></tr>)
          ) : customers.map(c => (
            <tr key={c.user_id} className="border-b border-brand-border/50 hover:bg-brand-surface/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {c.picture ? <img src={c.picture} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-brand-border flex items-center justify-center text-xs text-muted-foreground">{c.name?.[0]}</div>}
                  <span className="text-foreground">{c.name || 'No name'}</span>
                  {c.is_admin && <span className="text-[10px] uppercase tracking-widest text-primary border border-primary/30 px-1.5 py-0.5">Admin</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewsletterTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/newsletter`, { withCredentials: true })
      .then(r => setSubs(r.data.subscribers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{subs.length} subscribers</p>
      <div className="border border-brand-border overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}><td colSpan={2} className="px-4 py-4"><div className="h-4 bg-brand-surface animate-pulse rounded" /></td></tr>)
            ) : subs.map((s, i) => (
              <tr key={i} className="border-b border-brand-border/50 hover:bg-brand-surface/50">
                <td className="px-4 py-3 text-foreground">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(s.subscribed_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CmsTab() {
  const CMS_KEYS = ['hero', 'brand_story', 'store_details', 'services', 'testimonials', 'faqs'];
  const [blocks, setBlocks] = useState({});
  const [editing, setEditing] = useState(null);
  const [rawJson, setRawJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const fetchBlocks = async () => {
    const results = {};
    await Promise.all(CMS_KEYS.map(async key => {
      try {
        const res = await axios.get(`${API}/cms/${key}`, { withCredentials: true });
        results[key] = res.data;
      } catch { results[key] = null; }
    }));
    setBlocks(results);
  };

  useEffect(() => { fetchBlocks(); }, []);

  const openEdit = (key) => {
    setEditing(key);
    setRawJson(JSON.stringify(blocks[key] || {}, null, 2));
    setJsonError('');
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(rawJson);
      await axios.put(`${API}/admin/cms/${editing}`, parsed, { withCredentials: true });
      toast.success('CMS block updated');
      setEditing(null);
      fetchBlocks();
    } catch (e) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="space-y-3">
      {CMS_KEYS.map(key => (
        <div key={key} className="bg-brand-surface border border-brand-border p-4 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm font-medium text-foreground capitalize">{key.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{blocks[key] ? 'Content available' : 'Not set'}</p>
          </div>
          <button onClick={() => openEdit(key)} className="flex items-center gap-1.5 text-xs uppercase tracking-widest border border-brand-border text-muted-foreground hover:border-primary hover:text-primary px-3 py-1.5 transition-colors">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative bg-brand-bg border border-brand-border w-full max-w-2xl mb-10 z-10">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h2 className="font-serif text-xl text-foreground capitalize">Edit: {editing.replace('_', ' ')}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5">
              <textarea value={rawJson} onChange={e => { setRawJson(e.target.value); setJsonError(''); }} rows={18}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              {jsonError && <p className="text-xs text-destructive mt-2">{jsonError}</p>}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-brand-border">
              <button onClick={() => setEditing(null)} className="px-6 py-2.5 text-xs uppercase tracking-widest text-muted-foreground border border-brand-border hover:text-foreground">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenericPlaceholderTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <p className="text-sm uppercase tracking-widest">{label}</p>
      <p className="text-xs mt-2">This section is managed via the API.</p>
    </div>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
    if (!authLoading && user && !user.is_admin) navigate('/');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.is_admin) {
      axios.get(`${API}/admin/analytics`, { withCredentials: true })
        .then(r => setAnalytics(r.data))
        .catch(() => {});
    }
  }, [user]);

  if (authLoading || !user?.is_admin) return null;

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardTab analytics={analytics} />;
      case 'products': return <ProductsTab />;
      case 'orders': return <OrdersTab />;
      case 'collections': return <CollectionsTab />;
      case 'coupons': return <CouponsTab />;
      case 'enquiries': return <EnquiriesTab />;
      case 'customers': return <CustomersTab />;
      case 'newsletter': return <NewsletterTab />;
      case 'cms': return <CmsTab />;
      default: return <GenericPlaceholderTab label={tab} />;
    }
  };

  const currentTab = TABS.find(t => t.id === tab);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-brand-surface border-r border-brand-border transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col`}>
        <div className="p-5 border-b border-brand-border">
          <p className="font-serif text-lg text-foreground">Admin</p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Angarakha</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-sans uppercase tracking-[0.12em] transition-colors ${
                tab === t.id ? 'text-primary bg-primary/10 border-r-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-brand-bg'
              }`}>
              <t.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-border">
          <button onClick={() => navigate('/')} className="w-full text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Store
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-brand-bg border-b border-brand-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <LayoutGrid className="w-5 h-5" />
            </button>
            {currentTab && (
              <div className="flex items-center gap-2">
                <currentTab.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <h1 className="font-sans text-sm uppercase tracking-[0.15em] text-foreground">{currentTab.label}</h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user.picture && <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />}
            <span className="text-xs text-muted-foreground hidden sm:block">{user.name}</span>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
