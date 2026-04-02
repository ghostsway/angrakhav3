import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WishlistPage() {
  const { user, login } = useAuth();
  const { wishlist, removeFromWishlist, fetchWishlist } = useWishlist();
  const { addItem } = useCart();

  if (!user) {
    return (
      <div className="py-20 text-center" data-testid="wishlist-login">
        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
        <h1 className="font-serif text-3xl font-light text-foreground mb-3">Your Wishlist</h1>
        <p className="text-sm font-sans text-muted-foreground mb-8">Sign in to save your favourite pieces.</p>
        <button onClick={login} className="bg-primary text-primary-foreground px-8 py-3 text-xs font-sans uppercase tracking-[0.2em]" data-testid="wishlist-login-btn">Sign in with Google</button>
      </div>
    );
  }

  const handleAddToCart = async (product) => {
    try {
      await addItem({
        product_id: product.product_id, product_slug: product.slug,
        name: product.name, image: (product.images || [])[0] || '',
        size: product.sizes?.[0] || 'M', color: product.color || '', price: product.price, quantity: 1
      });
      toast.success(`${product.name} added to cart`);
    } catch { toast.error('Failed to add to cart'); }
  };

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
    toast.success('Removed from wishlist');
  };

  return (
    <div className="py-12 lg:py-20" data-testid="wishlist-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-10">My Wishlist</h1>
        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
            <p className="font-serif text-xl text-foreground mb-2">Your wishlist is empty</p>
            <p className="text-sm font-sans text-muted-foreground mb-6">Browse our collections to find pieces you love.</p>
            <Link to="/collections" className="border border-primary text-primary px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all">Browse Collections</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" data-testid="wishlist-grid">
            {wishlist.map(item => {
              const p = item.product;
              if (!p) return null;
              return (
                <div key={p.product_id} className="group" data-testid={`wishlist-item-${p.slug}`}>
                  <Link to={`/products/${p.slug}`} className="block">
                    <div className="img-zoom aspect-[3/4] bg-brand-surface relative">
                      <img src={(p.images || [])[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </Link>
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">{p.category?.replace('_', ' ')}</p>
                    <h3 className="font-serif text-lg font-light text-foreground">{p.name}</h3>
                    <p className="text-sm font-sans text-primary font-medium">Rs {p.price?.toLocaleString('en-IN')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddToCart(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 text-xs font-sans uppercase tracking-wider" data-testid={`wishlist-add-cart-${p.slug}`}>
                        <ShoppingBag className="w-3 h-3" /> Add to Cart
                      </button>
                      <button onClick={() => handleRemove(p.product_id)} className="p-2 border border-brand-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors" data-testid={`wishlist-remove-${p.slug}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
