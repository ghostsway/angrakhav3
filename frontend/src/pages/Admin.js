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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-brand-surface border border-brand-border p-5" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>
      <p className="font-serif text-2xl font-light text-foreground">{value}</p>
      {sub && <p className="text-xs font-sans text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ analytics }) {
  if (!analytics) return <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>;
  const a = analytics;
  return (
    <div className="space-y-8" data-testid="admin-dashboard">
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

      {/* Revenue Chart */}
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

      {/* Top Products + Recent Orders side by side */}
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

// ─── Product Form Modal ───────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto" data-testid="product-form-modal">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-brand-bg border border-brand-border w-full max-w-3xl mb-10 z-10">
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <h2 className="font-serif text-xl text-foreground">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Name *</label>
              <input value={form.name} onChange={e => { u('name', e.target.value); if (!product) u('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-name" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Slug</label>
              <input value={form.slug} onChange={e => u('slug', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-slug" />
            </div>
          </div>
          {/* Short desc */}
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Short Description</label>
            <input value={form.short_description} onChange={e => u('short_description', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-short-desc" />
          </div>
          {/* Full desc */}
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Full Description</label>
            <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={3}
              className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" data-testid="pf-desc" />
          </div>
          {/* Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Price (Rs) *</label>
              <input type="number" value={form.price} onChange={e => u('price', Number(e.target.value))}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-price" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Compare Price</label>
              <input type="number" value={form.compare_price} onChange={e => u('compare_price', Number(e.target.value))}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-compare" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e => u('category', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-category">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Fit</label>
              <select value={form.fit} onChange={e => u('fit', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-fit">
                {FITS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          {/* Fabric, Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Fabric</label>
              <input value={form.fabric} onChange={e => u('fabric', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-fabric" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Color</label>
              <input value={form.color} onChange={e => u('color', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-color" />
            </div>
          </div>
          {/* Images */}
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Image URLs</label>
            {(form.images || ['']).map((img, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={img} onChange={e => { const imgs = [...(form.images || [''])]; imgs[i] = e.target.value; u('images', imgs); }}
                  placeholder="https://..." className="flex-1 bg-brand-surface border border-brand-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid={`pf-image-${i}`} />
                {(form.images || []).length > 1 && (
                  <button onClick={() => u('images', form.images.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive px-2"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button onClick={() => u('images', [...(form.images || []), ''])} className="text-xs font-sans text-primary hover:underline" data-testid="pf-add-image">+ Add image</button>
          </div>
          {/* Occasions */}
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Occasions</label>
            <div className="flex gap-2 flex-wrap">
              {OCCASIONS.map(o => (
                <button key={o} onClick={() => toggleArray('occasions', o)} type="button"
                  className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-all ${(form.occasions || []).includes(o) ? 'border-primary bg-primary/20 text-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
                  data-testid={`pf-occasion-${o}`}>{o}</button>
              ))}
            </div>
          </div>
          {/* Sizes */}
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Available Sizes</label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(s => (
                <button key={s} onClick={() => toggleArray('sizes', s)} type="button"
                  className={`min-w-[40px] h-8 px-2 text-xs border transition-all ${(form.sizes || []).includes(s) ? 'border-primary bg-primary text-primary-foreground' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
                  data-testid={`pf-size-${s}`}>{s}</button>
              ))}
            </div>
          </div>
          {/* Tags */}
          <div>
            <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Tags (comma separated)</label>
            <input value={(form.tags || []).join(', ')} onChange={e => u('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="wedding, bestseller, new" className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-tags" />
          </div>
          {/* Care & Lining */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Care Instructions</label>
              <input value={form.care} onChange={e => u('care', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-care" />
            </div>
            <div>
              <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Lining</label>
              <input value={form.lining} onChange={e => u('lining', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="pf-lining" />
            </div>
          </div>
          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.in_stock} onChange={e => u('in_stock', e.target.checked)} className="accent-brand-gold" data-testid="pf-in-stock" />
              <span className="text-sm font-sans text-foreground">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => u('featured', e.target.checked)} className="accent-brand-gold" data-testid="pf-featured" />
              <span className="text-sm font-sans text-foreground">Featured</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-brand-border">
          <button onClick={onClose} className="px-6 py-2.5 text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground border border-brand-border hover:text-foreground transition-colors" data-testid="pf-cancel">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 text-xs font-sans uppercase tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50" data-testid="pf-save">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {product} = edit
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/products?page=${p}&q=${encodeURIComponent(q)}`, { withCredentials: true });
      setProducts(res.data.products); setTotal(res.data.total); setPage(p);
    } catch {} finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProducts(); }, []);

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
    <div data-testid="admin-products">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center bg-brand-surface border border-brand-border flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground ml-3" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts(1, search)}
              placeholder="Search products..." className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none" data-testid="admin-product-search" />
          </div>
          <span className="text-xs text-muted-foreground">{total} total</span>
        </div>
        <button onClick={() => setEditing({})}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-primary/90 transition-all" data-testid="add-product-btn">
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      {/* Table */}
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
              <tr key={p.product_id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors" data-testid={`admin-product-row-${p.product_id}`}>
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
                    <button onClick={() => window.open(`/products/${p.slug}`, '_blank')} className="p-1.5 text-muted-foreground hover:text-foreground" title="View"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditing(p)} className="p-1.5 text-muted-foreground hover:text-primary" title="Edit" data-testid={`edit-product-${p.product_id}`}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(p.product_id, p.name)} className="p-1.5 text-muted-foreground hover:text-destructive" title="Delete" data-testid={`delete-product-${p.product_id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

// ─── Orders Tab ───────────────────────────────────────────────────────────────
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
    <div data-testid="admin-orders">
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => { setFilter(s); fetchOrders(s); }}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-all ${filter === s ? 'border-primary bg-primary/20 text-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
            data-testid={`filter-${s || 'all'}`}>{s || 'All'}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-brand-surface animate-pulse" />)
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No orders found</p>
        ) : orders.map(o => (
          <div key={o.order_id} className="bg-brand-surface border border-brand-border p-4" data-testid={`admin-order-${o.order_id}`}>
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
                  className="px-2 py-1 text-[10px] uppercase tracking-widest border border-brand-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  data-testid={`order-set-${s}-${o.order_id}`}>{s}</button>
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

// ─── Collections Tab ──────────────────────────────────────────────────────────
function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', hero_image: '', occasion_tags: [], featured: false, sort_order: 99 });

  const fetch = async () => {
    const res = await axios.get(`${API}/admin/collections`, { withCredentials: true });
    setCollec