import { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FilterContent = ({ filters, local, setLocal, apply, reset }) => (
  <div className="space-y-6">
    {/* Sort */}
    <div>
      <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Sort By</label>
      <select value={local.sort} onChange={e => setLocal(p => ({ ...p, sort: e.target.value }))}
        className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="filter-sort">
        <option value="featured">Featured</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="newest">Newest First</option>
      </select>
    </div>

    {/* Price Range */}
    <div>
      <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
        Price Range {filters.price_range && <span className="normal-case tracking-normal text-muted-foreground/70">(Rs {filters.price_range.min.toLocaleString()} - Rs {filters.price_range.max.toLocaleString()})</span>}
      </label>
      <div className="flex gap-2">
        <input type="number" placeholder="Min" value={local.min_price} onChange={e => setLocal(p => ({ ...p, min_price: e.target.value }))}
          className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="filter-min-price" />
        <input type="number" placeholder="Max" value={local.max_price} onChange={e => setLocal(p => ({ ...p, max_price: e.target.value }))}
          className="w-full bg-brand-bg border border-brand-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="filter-max-price" />
      </div>
    </div>

    {/* Category */}
    {filters.categories?.length > 0 && (
      <div>
        <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {filters.categories.map(c => (
            <button key={c} onClick={() => setLocal(p => ({ ...p, category: p.category === c ? '' : c }))}
              className={`px-3 py-1.5 text-xs font-sans border transition-all ${local.category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
              data-testid={`filter-cat-${c}`}>
              {c.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Size */}
    {filters.sizes?.length > 0 && (
      <div>
        <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Size</label>
        <div className="flex flex-wrap gap-2">
          {filters.sizes.map(s => (
            <button key={s} onClick={() => setLocal(p => ({ ...p, size: p.size === s ? '' : s }))}
              className={`min-w-[40px] h-9 px-2 text-xs font-sans border transition-all ${local.size === s ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
              data-testid={`filter-size-${s}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Color */}
    {filters.colors?.length > 0 && (
      <div>
        <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {filters.colors.map(c => (
            <button key={c} onClick={() => setLocal(p => ({ ...p, color: p.color === c ? '' : c }))}
              className={`px-3 py-1.5 text-xs font-sans border transition-all ${local.color === c ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
              data-testid={`filter-color-${c}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Fabric */}
    {filters.fabrics?.length > 0 && (
      <div>
        <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Fabric</label>
        <div className="flex flex-wrap gap-2">
          {filters.fabrics.map(f => (
            <button key={f} onClick={() => setLocal(p => ({ ...p, fabric: p.fabric === f ? '' : f }))}
              className={`px-3 py-1.5 text-xs font-sans border transition-all ${local.fabric === f ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
              data-testid={`filter-fabric-${f}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Occasion */}
    {filters.occasions?.length > 0 && (
      <div>
        <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Occasion</label>
        <div className="flex flex-wrap gap-2">
          {filters.occasions.map(o => (
            <button key={o} onClick={() => setLocal(p => ({ ...p, occasion: p.occasion === o ? '' : o }))}
              className={`px-3 py-1.5 text-xs font-sans border transition-all capitalize ${local.occasion === o ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-muted-foreground hover:border-primary'}`}
              data-testid={`filter-occasion-${o}`}>
              {o}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Buttons */}
    <div className="flex gap-3 pt-2">
      <button onClick={apply} className="flex-1 bg-primary text-primary-foreground py-2.5 text-xs font-sans uppercase tracking-[0.15em]" data-testid="filter-apply">Apply Filters</button>
      <button onClick={reset} className="px-4 py-2.5 border border-brand-border text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground" data-testid="filter-reset">Reset</button>
    </div>
  </div>
);

export default function FilterSidebar({ onFilter, activeFilters = {}, className = '' }) {
  const [filters, setFilters] = useState(null);
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState({
    category: '', fabric: '', color: '', occasion: '', size: '',
    min_price: '', max_price: '', sort: 'featured'
  });

  useEffect(() => {
    axios.get(`${API}/search/filters`).then(r => setFilters(r.data)).catch(() => {});
  }, []);

  useEffect(() => { setLocal(prev => ({ ...prev, ...activeFilters })); }, [activeFilters]);

  const apply = () => {
    const cleaned = {};
    Object.entries(local).forEach(([k, v]) => { if (v) cleaned[k] = v; });
    onFilter(cleaned);
    setOpen(false);
  };

  const reset = () => {
    const fresh = { category: '', fabric: '', color: '', occasion: '', size: '', min_price: '', max_price: '', sort: 'featured' };
    setLocal(fresh);
    onFilter({});
    setOpen(false);
  };

  const activeCount = Object.values(local).filter(v => v && v !== 'featured').length;

  if (!filters) return null;

  return (
    <>
      {/* Mobile trigger */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-brand-border text-xs font-sans uppercase tracking-[0.15em] text-foreground"
        data-testid="filter-toggle">
        <SlidersHorizontal className="w-4 h-4" />
        Filters {activeCount > 0 && <span className="bg-primary text-primary-foreground px-1.5 py-0.5 text-[10px] rounded-full">{activeCount}</span>}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-brand-bg border-l border-brand-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-light text-foreground">Filters</h3>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <FilterContent filters={filters} local={local} setLocal={setLocal} apply={apply} reset={reset} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:block ${className}`} data-testid="filter-sidebar">
        <h3 className="font-serif text-xl font-light text-foreground mb-6">Filters</h3>
        <FilterContent filters={filters} local={local} setLocal={setLocal} apply={apply} reset={reset} />
      </div>
    </>
  );
}
