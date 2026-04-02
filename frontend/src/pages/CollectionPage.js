import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import { ChevronRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CollectionPage() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = (f = filters, p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', p);
    params.set('limit', '12');
    if (f.sort) params.set('sort', f.sort);
    if (f.min_price) params.set('min_price', f.min_price);
    if (f.max_price) params.set('max_price', f.max_price);

    // For collections, use the collection endpoint
    axios.get(`${API}/collections/${slug}?${params.toString()}`)
      .then(r => {
        setCollection(r.data);
        let prods = r.data.products || [];
        // Apply client-side filters for category/size/color/fabric/occasion
        if (f.category) prods = prods.filter(p => p.category === f.category);
        if (f.size) prods = prods.filter(p => p.sizes?.includes(f.size));
        if (f.color) prods = prods.filter(p => p.color?.toLowerCase().includes(f.color.toLowerCase()));
        if (f.fabric) prods = prods.filter(p => p.fabric?.toLowerCase().includes(f.fabric.toLowerCase()));
        if (f.occasion) prods = prods.filter(p => p.occasions?.includes(f.occasion));
        if (p === 1) setProducts(prods);
        else setProducts(prev => [...prev, ...prods]);
        setTotalPages(r.data.pages || 1);
        setTotal(r.data.total || 0);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts({}, 1); }, [slug]);

  const handleFilter = (f) => {
    setFilters(f);
    fetchProducts(f, 1);
  };

  const loadMore = () => fetchProducts(filters, page + 1);

  return (
    <div className="py-12 lg:py-20" data-testid="collection-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-sans text-muted-foreground mb-6" data-testid="collection-breadcrumb">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/collections" className="hover:text-primary transition-colors">Collections</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{collection?.name || slug}</span>
        </nav>

        {/* Hero strip */}
        {collection && (
          <div className="relative h-48 sm:h-64 mb-10 overflow-hidden" data-testid="collection-hero">
            <img src={collection.hero_image} alt={collection.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-2">{collection.name}</h1>
              <p className="text-sm font-sans text-white/70 max-w-lg">{collection.description}</p>
            </div>
          </div>
        )}

        {/* Layout with filter sidebar */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar onFilter={handleFilter} activeFilters={filters} className="w-64 shrink-0" />

          {/* Products */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6" data-testid="collection-toolbar">
              <p className="text-sm font-sans text-muted-foreground">{total} product{total !== 1 ? 's' : ''}</p>
              {/* Mobile filter trigger is inside FilterSidebar */}
              <div className="lg:hidden">
                <FilterSidebar onFilter={handleFilter} activeFilters={filters} />
              </div>
            </div>

            {/* Product Grid */}
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] bg-brand-surface animate-pulse" />
                    <div className="h-4 bg-brand-surface animate-pulse w-3/4" />
                    <div className="h-3 bg-brand-surface animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6" data-testid="product-grid">
                  {products.map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)}
                </div>
                {page < totalPages && (
                  <div className="text-center mt-12">
                    <button onClick={loadMore} className="border border-primary text-primary px-8 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all" data-testid="load-more-btn">Load More</button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="font-serif text-2xl text-foreground mb-4">No products found</p>
                <p className="text-sm font-sans text-muted-foreground mb-4">Try adjusting your filters.</p>
                <button onClick={() => handleFilter({})} className="text-sm font-sans text-primary hover:underline">Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
