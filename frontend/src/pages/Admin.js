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
    setCollections(res.data.collections);
  };
  useEffect(() => { fetch(); }, []);

  const startEdit = (col) => {
    setEditing(col.collection_id);
    setForm({ ...col });
  };

  const save = async () => {
    if (editing === 'new') {
      await axios.post(`${API}/admin/collections`, form, { withCredentials: true });
      toast.success('Collection created');
    } else {
      await axios.put(`${API}/admin/collections/${editing}`, form, { withCredentials: true });
      toast.success('Collection updated');
    }
    setEditing(null);
    fetch();
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await axios.delete(`${API}/admin/collections/${id}`, { withCredentials: true });
    toast.success('Deleted');
    fetch();
  };

  return (
    <div data-testid="admin-collections">
      <div className="flex justify-between mb-6">
        <h3 className="text-sm font-sans text-muted-foreground">{collections.length} collections</h3>
        <button onClick={() => { setEditing('new'); setForm({ name: '', slug: '', description: '', hero_image: '', occasion_tags: [], featured: false, sort_order: 99 }); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-primary/90" data-testid="add-collection-btn">
          <Plus className="w-3.5 h-3.5" /> Add Collection
        </button>
      </div>
      <div className="space-y-3">
        {collections.map(col => (
          <div key={col.collection_id} className="bg-brand-surface border border-brand-border p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {col.hero_image && <img src={col.hero_image} alt="" className="w-16 h-12 object-cover shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{col.name}</p>
                <p className="text-xs text-muted-foreground truncate">{col.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => startEdit(col)} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(col.collection_id, col.name)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative bg-brand-bg border border-brand-border w-full max-w-lg z-10 p-5 space-y-4">
            <h2 className="font-serif text-xl text-foreground">{editing === 'new' ? 'Add Collection' : 'Edit Collection'}</h2>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value, slug: editing === 'new' ? e.target.value.toLowerCase().replace(/\s+/g, '-') : form.slug})}
              placeholder="Name" className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
              placeholder="Slug" className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
              placeholder="Description" className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            <input value={form.hero_image} onChange={e => setForm({...form, hero_image: e.target.value})}
              placeholder="Hero image URL" className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground border border-brand-border">Cancel</button>
              <button onClick={save} className="px-5 py-2 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Enquiries Tab ────────────────────────────────────────────────────────────
function EnquiriesTab() {
  const [enquiries, setEnquiries] = useState([]);
  useEffect(() => {
    axios.get(`${API}/admin/enquiries`, { withCredentials: true }).then(r => setEnquiries(r.data.enquiries)).catch(() => {});
  }, []);

  const mark = async (id, status) => {
    await axios.put(`${API}/admin/enquiries/${id}`, { status }, { withCredentials: true });
    setEnquiries(prev => prev.map(e => e.enquiry_id === id ? {...e, status} : e));
    toast.success('Updated');
  };

  return (
    <div className="space-y-3" data-testid="admin-enquiries">
      {enquiries.length === 0 ? <p className="text-center text-muted-foreground py-8">No enquiries yet</p> :
        enquiries.map(e => (
          <div key={e.enquiry_id} className="bg-brand-surface border border-brand-border p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">{e.name} - <span className="text-muted-foreground">{e.email}</span></p>
                {e.phone && <p className="text-xs text-muted-foreground">{e.phone}</p>}
              </div>
              <StatusBadge status={e.status} />
            </div>
            {e.occasion && <p className="text-xs text-primary mb-1">Occasion: {e.occasion}</p>}
            <p className="text-sm text-muted-foreground mb-3">{e.message}</p>
            <div className="flex gap-2">
              {e.status !== 'reviewed' && <button onClick={() => mark(e.enquiry_id, 'reviewed')} className="text-[10px] uppercase tracking-widest border border-brand-border text-muted-foreground px-2 py-1 hover:border-primary hover:text-primary">Mark Reviewed</button>}
              {e.status !== 'contacted' && <button onClick={() => mark(e.enquiry_id, 'contacted')} className="text-[10px] uppercase tracking-widest border border-brand-border text-muted-foreground px-2 py-1 hover:border-primary hover:text-primary">Mark Contacted</button>}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────
function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    axios.get(`${API}/admin/customers`, { withCredentials: true }).then(r => setCustomers(r.data.customers)).catch(() => {});
  }, []);
  return (
    <div data-testid="admin-customers">
      <div className="border border-brand-border overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead><tr className="border-b border-brand-border bg-brand-surface">
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Name</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Joined</th>
            <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Admin</th>
          </tr></thead>
          <tbody>{customers.map(c => (
            <tr key={c.user_id} className="border-b border-brand-border/50">
              <td className="px-4 py-3 text-foreground">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '-'}</td>
              <td className="px-4 py-3 text-center">{c.is_admin ? <Check className="w-4 h-4 text-primary mx-auto" /> : '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Newsletter Tab ───────────────────────────────────────────────────────────
function NewsletterTab() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    axios.get(`${API}/admin/newsletter`, { withCredentials: true }).then(r => { setSubs(r.data.subscribers); setTotal(r.data.total); }).catch(() => {});
  }, []);
  return (
    <div data-testid="admin-newsletter">
      <p className="text-sm text-muted-foreground mb-4">{total} subscriber{total !== 1 ? 's' : ''}</p>
      <div className="border border-brand-border overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead><tr className="border-b border-brand-border bg-brand-surface">
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">Subscribed</th>
          </tr></thead>
          <tbody>{subs.map((s, i) => (
            <tr key={i} className="border-b border-brand-border/50">
              <td className="px-4 py-3 text-foreground">{s.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('en-IN') : '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CMS Tab ──────────────────────────────────────────────────────────────────
function CMSTab() {
  const [blocks, setBlocks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState('');

  useEffect(() => {
    axios.get(`${API}/admin/cms`, { withCredentials: true }).then(r => setBlocks(r.data.blocks)).catch(() => {});
  }, []);

  const startEdit = (block) => {
    setEditing(block.key);
    setFormData(JSON.stringify(block, null, 2));
  };

  const save = async () => {
    try {
      const data = JSON.parse(formData);
      await axios.put(`${API}/admin/cms/${editing}`, data, { withCredentials: true });
      toast.success('CMS block updated');
      setEditing(null);
      const res = await axios.get(`${API}/admin/cms`, { withCredentials: true });
      setBlocks(res.data.blocks);
    } catch { toast.error('Invalid JSON'); }
  };

  return (
    <div data-testid="admin-cms">
      <p className="text-sm text-muted-foreground mb-4">Edit homepage content blocks (hero text, brand story, FAQs, testimonials, store details)</p>
      <div className="space-y-3">
        {blocks.map(b => (
          <div key={b.key} className="bg-brand-surface border border-brand-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground capitalize">{b.key.replace('_', ' ')}</p>
              <p className="text-xs text-muted-foreground">{b.title || b.address || `${Object.keys(b).length} fields`}</p>
            </div>
            <button onClick={() => startEdit(b)} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative bg-brand-bg border border-brand-border w-full max-w-2xl z-10 p-5 space-y-4">
            <h2 className="font-serif text-xl text-foreground capitalize">Edit: {editing.replace('_', ' ')}</h2>
            <textarea value={formData} onChange={e => setFormData(e.target.value)} rows={15}
              className="w-full bg-brand-surface border border-brand-border px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-5 py-2 text-xs uppercase tracking-widest text-muted-foreground border border-brand-border">Cancel</button>
              <button onClick={save} className="px-5 py-2 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(urlTab || 'dashboard');
  const [isAdmin, setIsAdmin] = useState(null); // null=checking, true/false
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
  }, [urlTab]);

  const switchTab = (id) => {
    setActiveTab(id);
    navigate(`/admin/${id}`, { replace: true });
  };

  // Check admin status & setup
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // Try to access admin analytics - if 403, try setup
        const res = await axios.get(`${API}/admin/analytics`, { withCredentials: true });
        setIsAdmin(true);
        setAnalytics(res.data);
      } catch (err) {
        if (err.response?.status === 403) {
          // Try auto-setup as admin
          try {
            await axios.post(`${API}/admin/setup`, {}, { withCredentials: true });
            setIsAdmin(true);
            const res = await axios.get(`${API}/admin/analytics`, { withCredentials: true });
            setAnalytics(res.data);
            toast.success('You are now an admin');
          } catch { setIsAdmin(false); }
        } else { setIsAdmin(false); }
      }
    })();
  }, [user]);

  if (authLoading) return <div className="py-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (!user) return (
    <div className="py-20 text-center" data-testid="admin-login-prompt">
      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
      <h1 className="font-serif text-3xl font-light text-foreground mb-3">Admin Panel</h1>
      <p className="text-sm font-sans text-muted-foreground mb-8">Sign in to access the admin dashboard.</p>
      <button onClick={login} className="bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all" data-testid="admin-login-btn">
        Sign in with Google
      </button>
    </div>
  );

  if (isAdmin === null) return <div className="py-20 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-sm text-muted-foreground mt-4">Checking permissions...</p></div>;

  if (isAdmin === false) return (
    <div className="py-20 text-center">
      <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" strokeWidth={1} />
      <h1 className="font-serif text-3xl font-light text-foreground mb-3">Access Denied</h1>
      <p className="text-sm font-sans text-muted-foreground">You do not have admin permissions.</p>
    </div>
  );

  return (
    <div className="min-h-screen flex" data-testid="admin-panel">
      {/* Sidebar */}
      <aside className="w-56 lg:w-64 bg-brand-surface border-r border-brand-border shrink-0 hidden md:block">
        <div className="p-5 border-b border-brand-border">
          <h2 className="font-serif text-lg text-foreground">Admin Panel</h2>
          <p className="text-xs font-sans text-muted-foreground mt-1">{user.name}</p>
        </div>
        <nav className="p-3 space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-sans transition-colors rounded-sm ${activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-brand-bg'}`}
              data-testid={`admin-tab-${t.id}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border z-40 flex overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)}
            className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2 text-[10px] ${activeTab === t.id ? 'text-primary' : 'text-muted-foreground'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 pb-20 md:pb-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-serif text-2xl font-light text-foreground capitalize">{activeTab}</h1>
            {activeTab === 'dashboard' && (
              <button onClick={async () => {
                const res = await axios.get(`${API}/admin/analytics`, { withCredentials: true });
                setAnalytics(res.data); toast.success('Refreshed');
              }} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary" data-testid="refresh-analytics">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            )}
          </div>

          {activeTab === 'dashboard' && <DashboardTab analytics={analytics} />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'collections' && <CollectionsTab />}
          {activeTab === 'coupons' && <CouponsTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'returns' && <ReturnsAdminTab />}
          {activeTab === 'abandoned' && <AbandonedCartsTab />}
          {activeTab === 'giftcards' && <GiftCardsAdminTab />}
          {activeTab === 'enquiries' && <EnquiriesTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'newsletter' && <NewsletterTab />}
          {activeTab === 'cms' && <CMSTab />}
        </div>
      </main>
    </div>
  );
}

// ─── Coupons Tab ──────────────────────────────────────────────────────────────

function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order: 0,
    max_discount: '',
    expiry_date: '',
    usage_limit: '',
    active: true
  });

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/coupons`, { withCredentials: true });
      setCoupons(res.data.coupons);
    } catch (err) {
      toast.error('Failed to load coupons');
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order: 0,
      max_discount: '',
      expiry_date: '',
      usage_limit: '',
      active: true
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order: coupon.min_order || 0,
      max_discount: coupon.max_discount || '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      usage_limit: coupon.usage_limit || '',
      active: coupon.active
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order: parseFloat(form.min_order) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        expiry_date: form.expiry_date || null
      };

      if (editingCoupon) {
        await axios.put(`${API}/admin/coupons/${editingCoupon.coupon_id}`, payload, { withCredentials: true });
        toast.success('Coupon updated successfully');
      } else {
        await axios.post(`${API}/admin/coupons`, payload, { withCredentials: true });
        toast.success('Coupon created successfully');
      }
      fetchCoupons();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save coupon');
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`${API}/admin/coupons/${couponId}`, { withCredentials: true });
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-light text-foreground">Coupons</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-sans uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Coupon'}
        </button>
      </div>

      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6 mb-6">
          <h3 className="font-sans text-lg font-medium text-foreground mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  required
                  placeholder="SUMMER50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Discount Type *</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({...form, discount_type: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Discount Value * {form.discount_type === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({...form, discount_value: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  placeholder={form.discount_type === 'percentage' ? '10' : '500'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.min_order}
                  onChange={(e) => setForm({...form, min_order: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Max Discount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.max_discount}
                  onChange={(e) => setForm({...form, max_discount: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({...form, usage_limit: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({...form, expiry_date: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({...form, active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 text-sm font-sans uppercase tracking-wider hover:bg-primary/90 transition-colors"
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-brand-surface border border-brand-border text-foreground px-6 py-2 text-sm font-sans uppercase tracking-wider hover:bg-brand-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-bg border-b border-brand-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-sans uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="px-4 py-3 text-left text-xs font-sans uppercase tracking-wider text-muted-foreground">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-sans uppercase tracking-wider text-muted-foreground">Min Order</th>
                <th className="px-4 py-3 text-left text-xs font-sans uppercase tracking-wider text-muted-foreground">Usage</th>
                <th className="px-4 py-3 text-left text-xs font-sans uppercase tracking-wider text-muted-foreground">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-sans uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center text-xs font-sans uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {coupons.map((coupon) => (
                <tr key={coupon.coupon_id} className="hover:bg-brand-bg/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">{coupon.code}</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value}`}
                    {coupon.max_discount && <span className="text-xs text-muted-foreground"> (Max: ₹{coupon.max_discount})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">₹{coupon.min_order}</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {coupon.times_used || 0}
                    {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {coupon.expiry_date 
                      ? new Date(coupon.expiry_date).toLocaleDateString() 
                      : 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-sans uppercase tracking-wider rounded ${
                      coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-1 hover:bg-brand-border rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.coupon_id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No coupons found. Create your first coupon to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryTab() {
  const [inventory, setInventory] = useState(null);
  useEffect(() => { axios.get(`${API}/admin/inventory`, { withCredentials: true }).then(r => setInventory(r.data)).catch(() => {}); }, []);
  const updateStock = async (productId, sizeStock) => {
    try {
      await axios.put(`${API}/admin/inventory/${productId}`, { size_stock: sizeStock }, { withCredentials: true });
      toast.success('Inventory updated');
      const r = await axios.get(`${API}/admin/inventory`, { withCredentials: true });
      setInventory(r.data);
    } catch { toast.error('Failed to update'); }
  };
  if (!inventory) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  return (
    <div data-testid="admin-inventory">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-light text-foreground">Inventory Management</h2>
        <div className="flex gap-4 text-xs font-sans">
          <span className="text-yellow-400">Low Stock: {inventory.low_stock?.length || 0}</span>
          <span className="text-red-400">Out of Stock: {inventory.out_of_stock?.length || 0}</span>
        </div>
      </div>
      {inventory.low_stock?.length > 0 && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-800/50 p-4">
          <h3 className="text-xs font-sans uppercase tracking-wider text-yellow-400 mb-2">Low Stock Alerts</h3>
          <div className="space-y-1">{inventory.low_stock.map((item, i) => (
            <p key={i} className="text-sm font-sans text-muted-foreground">{item.name} - Size {item.size}: <span className="text-yellow-400">{item.quantity} left</span></p>
          ))}</div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead><tr className="border-b border-brand-border text-left">
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Product</th>
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Stock by Size</th>
          </tr></thead>
          <tbody>{(inventory.products || []).map(p => (
            <tr key={p.product_id} className="border-b border-brand-border/50">
              <td className="py-3 text-foreground">{p.name}</td>
              <td className="py-3"><span className={`text-xs px-2 py-0.5 ${p.in_stock ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{p.in_stock ? 'In Stock' : 'Out of Stock'}</span></td>
              <td className="py-3"><div className="flex flex-wrap gap-1">{Object.entries(p.size_stock || {}).map(([s, q]) => (
                <span key={s} className={`text-xs px-2 py-1 border ${q <= 0 ? 'border-red-800 text-red-400' : q <= 5 ? 'border-yellow-800 text-yellow-400' : 'border-brand-border text-muted-foreground'}`}>{s}: {q}</span>
              ))}</div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Returns Admin Tab ─────────────────────────────────────────────────────────
function ReturnsAdminTab() {
  const [returns, setReturns] = useState([]);
  useEffect(() => { axios.get(`${API}/admin/returns`, { withCredentials: true }).then(r => setReturns(r.data.returns || [])).catch(() => {}); }, []);
  const updateStatus = async (returnId, status) => {
    try {
      await axios.put(`${API}/admin/returns/${returnId}`, { status }, { withCredentials: true });
      toast.success(`Return ${status}`);
      setReturns(prev => prev.map(r => r.return_id === returnId ? { ...r, status } : r));
    } catch { toast.error('Failed to update'); }
  };
  return (
    <div data-testid="admin-returns">
      <h2 className="font-serif text-xl font-light text-foreground mb-6">Return Requests</h2>
      {returns.length === 0 ? <p className="text-center py-12 text-muted-foreground">No return requests yet.</p> : (
        <div className="space-y-3">{returns.map(r => (
          <div key={r.return_id} className="bg-brand-surface border border-brand-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div><p className="text-sm font-sans font-medium text-foreground">{r.order_number || r.order_id}</p><p className="text-xs font-sans text-muted-foreground capitalize">{r.type} - {r.reason?.replace('_', ' ')}</p></div>
              <span className={`text-xs font-sans uppercase tracking-wider px-2 py-1 ${r.status === 'approved' ? 'bg-green-900/30 text-green-400' : r.status === 'rejected' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{r.status}</span>
            </div>
            {r.details && <p className="text-xs font-sans text-muted-foreground mb-2">{r.details}</p>}
            {r.status === 'pending' && (
              <div className="flex gap-2"><button onClick={() => updateStatus(r.return_id, 'approved')} className="text-xs text-green-400 border border-green-800 px-3 py-1 hover:bg-green-900/30">Approve</button><button onClick={() => updateStatus(r.return_id, 'rejected')} className="text-xs text-red-400 border border-red-800 px-3 py-1 hover:bg-red-900/30">Reject</button></div>
            )}
          </div>
        ))}</div>
      )}
    </div>
  );
}

// ─── Abandoned Carts Tab ────────────────────────────────────────────────────────
function AbandonedCartsTab() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { axios.get(`${API}/admin/abandoned-carts`, { withCredentials: true }).then(r => setCarts(r.data.carts || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  const sendReminder = async (cartId) => {
    try {
      const res = await axios.post(`${API}/admin/abandoned-carts/${cartId}/send-reminder`, {}, { withCredentials: true });
      toast.success(res.data.status === 'sent' ? 'Reminder sent!' : res.data.message || 'Could not send');
      setCarts(prev => prev.map(c => c.cart_id === cartId ? { ...c, recovery_email_sent: true } : c));
    } catch { toast.error('Failed to send reminder'); }
  };
  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  return (
    <div data-testid="admin-abandoned-carts">
      <h2 className="font-serif text-xl font-light text-foreground mb-6">Abandoned Carts ({carts.length})</h2>
      {carts.length === 0 ? <p className="text-center py-12 text-muted-foreground">No abandoned carts found.</p> : (
        <div className="space-y-3">{carts.map(c => (
          <div key={c.cart_id} className="bg-brand-surface border border-brand-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div><p className="text-sm font-sans text-foreground">{c.customer_name || c.email || 'Guest'}</p><p className="text-xs font-sans text-muted-foreground">{c.item_count} items - Rs {c.total_value?.toLocaleString('en-IN')}</p></div>
              <div className="flex items-center gap-3">
                {c.recovery_email_sent && <span className="text-xs text-green-400">Reminded</span>}
                {c.email && !c.recovery_email_sent && <button onClick={() => sendReminder(c.cart_id)} className="text-xs text-primary border border-primary px-3 py-1 hover:bg-primary/10">Send Reminder</button>}
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

// ─── Gift Cards Admin Tab ───────────────────────────────────────────────────────
function GiftCardsAdminTab() {
  const [cards, setCards] = useState([]);
  useEffect(() => { axios.get(`${API}/admin/giftcards`, { withCredentials: true }).then(r => setCards(r.data.giftcards || [])).catch(() => {}); }, []);
  return (
    <div data-testid="admin-giftcards">
      <h2 className="font-serif text-xl font-light text-foreground mb-6">Gift Cards ({cards.length})</h2>
      {cards.length === 0 ? <p className="text-center py-12 text-muted-foreground">No gift cards issued yet.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm font-sans">
          <thead><tr className="border-b border-brand-border text-left">
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Code</th>
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Balance</th>
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Recipient</th>
            <th className="py-3 text-xs uppercase tracking-wider text-muted-foreground">Status</th>
          </tr></thead>
          <tbody>{cards.map(c => (
            <tr key={c.giftcard_id} className="border-b border-brand-border/50">
              <td className="py-3 text-primary font-mono">{c.code}</td>
              <td className="py-3 text-foreground">Rs {c.amount?.toLocaleString('en-IN')}</td>
              <td className="py-3 text-foreground">Rs {c.balance?.toLocaleString('en-IN')}</td>
              <td className="py-3 text-muted-foreground">{c.recipient_name}</td>
              <td className="py-3"><span className={`text-xs px-2 py-0.5 ${c.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-muted text-muted-foreground'}`}>{c.status}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
