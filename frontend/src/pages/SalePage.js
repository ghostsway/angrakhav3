import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '@/components/ProductCard';
import { Tag } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/products?limit=50`).then(r => {
      const onSale = (r.data.products || []).filter(p => p.compare_price && p.compare_price > p.price);
      setProducts(onSale);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 lg:py-20" data-testid="sale-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Tag className="w-8 h-8 text-primary mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-2">Sale & Clearance</h1>
          <p className="text-sm font-sans text-muted-foreground">Exceptional pieces at exceptional prices.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] bg-brand-surface animate-pulse" />
                <div className="h-4 bg-brand-surface animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" data-testid="sale-grid">
            {products.map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-foreground mb-2">No sale items currently</p>
            <p className="text-sm font-sans text-muted-foreground mb-6">Check back soon for exclusive offers.</p>
            <Link to="/collections" className="border border-primary text-primary px-6 py-3 text-xs font-sans uppercase tracking-[0.2em]">Browse Collections</Link>
          </div>
        )}
      </div>
    </div>
  );
}
