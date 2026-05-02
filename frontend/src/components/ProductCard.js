import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ProductCard({ product, index = 0 }) {
  const { name, slug, price, images, category, tags, in_stock, badges } = product;
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user, login } = useAuth();
  const inWishlist = isInWishlist(product.product_id);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { login(); return; }
    if (inWishlist) {
      await removeFromWishlist(product.product_id);
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(product.product_id);
      toast.success('Added to wishlist');
    }
  };

  const allBadges = [];
  if (tags?.includes('new') || badges?.includes('new')) allBadges.push({ label: 'New', color: 'bg-primary text-primary-foreground' });
  if (tags?.includes('bestseller') || badges?.includes('bestseller')) allBadges.push({ label: 'Bestseller', color: 'bg-brand-surface/90 text-foreground border border-brand-border' });
  if (in_stock === false) allBadges.push({ label: 'Sold Out', color: 'bg-black/70 text-white' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="product-card group relative"
      data-testid={`product-card-${slug}`}
    >
      <Link to={`/products/${slug}`} className="block">
        <div className="img-zoom aspect-[3/4] bg-brand-surface relative">
          <img src={images?.[0] || ''} alt={name} className={`w-full h-full object-cover ${in_stock === false ? 'opacity-50' : ''}`} loading="lazy" />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {allBadges.map((b, i) => (
              <span key={i} className={`text-[10px] font-sans uppercase tracking-[0.2em] px-3 py-1 ${b.color}`} data-testid={`badge-${b.label.toLowerCase().replace(/\s/g, '-')}-${slug}`}>
                {b.label}
              </span>
            ))}
          </div>
          {/* Wishlist heart */}
          <button onClick={toggleWishlist}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-brand-bg/80 backdrop-blur-sm border border-brand-border opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`wishlist-toggle-${slug}`}>
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
          </button>
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">{category?.replace('_', ' ')}</p>
          <h3 className="font-serif text-lg font-light text-foreground group-hover:text-primary transition-colors duration-300">{name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-sans text-primary font-medium">Rs {price?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
