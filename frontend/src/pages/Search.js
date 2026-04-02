import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search as SearchIcon, TrendingUp, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [popular, setPopular] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [activeFilters, setActiveFilters] = useState({ sort: 'featured' });
  const debounceRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/search/popular`).then(r => setPopular(r.data.popular || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q); }
  }, []);

  // Autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      axios.get(`${API}/search/autocomplete?q=${encodeURIComponent(query)}`)
        .then(r => setSuggestions(r.data.suggestions || []))
        .catch(() => {});
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const doSearch = (q, filters = activeFilters) => {
    if (!q.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setSearchParams({ q });
    const params = new URLSearchParams({ q, limit: '20' });
    if (filters.sort && filters.sort !== 'featured') params.set('sort', filters.sort);
    if (filters.category) params.set('category', filters.category);
    if (filters.occasion) params.set('occasion', filters.occasion);
    axios.get(`${API}/search?${params.toString()}`)
      .then(r => {
        setProducts(r.data.products || []);
        setTotal(r.data.total || 0);
        // If no results, fetch similar/popular products
        if ((r.data.products || []).length === 0) {
          axios.get(`${API}/products?limit=4`).then(sr => setSimilar(sr.data.products || []));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="py-12 lg:py-20" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto mb-12 relative">
          <form onSubmit={e => { e.preventDefault(); doSearch(query); }} className="flex items-center border border-brand-border bg-brand-surface" data-testid="search-form">
            <SearchIcon className="w-5 h-5 text-muted-foreground ml-4" />
            <input type="text" value={query} onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for sherwanis, kurtas, bandhgalas..."
              className="flex-1 bg-transparent px-4 py-4 text-base font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
              data-testid="search-input" autoFocus />
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-4 text-xs font-sans uppercase tracking-[0.2em]" data-testid="search-submit">Search</button>
          </form>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-brand-surface border border-brand-border z-10 divide-y divide-brand-border" data-testid="search-suggestions">
              {suggestions.map(s => (
                <Link key={s.slug} to={`/products/${s.slug}`} className="flex items-center gap-3 p-3 hover:bg-brand-bg transition-colors" onClick={() => setShowSuggestions(false)}>
                  <div className="w-8 h-10 bg-brand-bg shrink-0 overflow-hidden">{s.image && <img src={s.image} alt="" className="w-full h-full object-cover" />}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-sans text-foreground truncate">{s.name}</p></div>
                  <span className="text-xs font-sans text-primary">Rs {s.price?.toLocaleString('en-IN')}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Popular searches */}
          {!searchParams.get('q') && popular.length > 0 && (
            <div className="mt-4" data-testid="popular-searches">
              <p className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {popular.map(p => (
                  <Link key={p.term} to={p.slug} className="px-3 py-1.5 border border-brand-border text-xs font-sans text-muted-foreground hover:text-primary hover:border-primary transition-colors">{p.term}</Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        {products.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-sans text-muted-foreground">{total} result{total !== 1 ? 's' : ''} for "{searchParams.get('q')}"</p>
            <select value={activeFilters.sort} onChange={e => { const f = { ...activeFilters, sort: e.target.value }; setActiveFilters(f); doSearch(query, f); }}
              className="bg-brand-surface border border-brand-border px-3 py-2 text-xs font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary" data-testid="search-sort">
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (<div key={i} className="space-y-3"><div className="aspect-[3/4] bg-brand-surface animate-pulse" /><div className="h-4 bg-brand-surface animate-pulse w-3/4" /></div>))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" data-testid="search-results">
            {products.map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)}
          </div>
        ) : searchParams.get('q') ? (
          <div className="text-center py-16" data-testid="search-empty">
            <p className="font-serif text-2xl text-foreground mb-4">No results found</p>
            <p className="text-sm font-sans text-muted-foreground mb-8">Try a different search term or browse our collections.</p>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Link to="/collections/wedding" className="border border-brand-border px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] text-foreground hover:border-primary transition-colors">Wedding</Link>
              <Link to="/collections/festive" className="border border-brand-border px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] text-foreground hover:border-primary transition-colors">Festive</Link>
              <Link to="/collections/all" className="border border-brand-border px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] text-foreground hover:border-primary transition-colors">All Products</Link>
            </div>
            {similar.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-light text-foreground mb-6">You might like</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto">
                  {similar.map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-foreground mb-4">What are you looking for?</p>
            <p className="text-sm font-sans text-muted-foreground">Search by product name, fabric, occasion or style.</p>
          </div>
        )}
      </div>
    </div>
  );
}
