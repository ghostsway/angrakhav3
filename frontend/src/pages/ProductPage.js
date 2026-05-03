import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Minus, Plus, ShoppingBag, ChevronRight, Star, Heart, Share2, Truck, RotateCcw, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import TrustBadges from '@/components/TrustBadges';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIZE_GUIDE = [
  { size: 'S', chest: '36"', waist: '30"', shoulder: '16"' },
  { size: 'M', chest: '38"', waist: '32"', shoulder: '17"' },
  { size: 'L', chest: '40"', waist: '34"', shoulder: '18"' },
  { size: 'XL', chest: '42"', waist: '36"', shoulder: '19"' },
  { size: 'XXL', chest: '44"', waist: '38"', shoulder: '20"' },
];

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { user, login } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { items: recentItems, addItem: addRecent } = useRecentlyViewed();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState({ reviews: [], average_rating: 0, total: 0 });
  const [related, setRelated] = useState([]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '', fit_feedback: 'True to size' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const imgRef = useRef(null);
  const touchStart = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    Promise.all([
      axios.get(`${API}/products/${slug}`),
      axios.get(`${API}/reviews/${slug}`)
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data);
      setReviews(rRes.data);
      if (pRes.data.sizes?.length) setSelectedSize(pRes.data.sizes[0]);
      addRecent(pRes.data);
      const occasion = pRes.data.occasions?.[0] || 'all';
      axios.get(`${API}/products?occasion=${occasion}&limit=4`).then(r => {
        setRelated((r.data.products || []).filter(p => p.slug !== slug).slice(0, 4));
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    try {
      await addItem({
        product_id: product.product_id, product_slug: product.slug,
        name: product.name, image: product.images?.[0] || '',
        size: selectedSize, color: product.color || '', price: product.price, quantity
      });
      toast.success(`${product.name} added to cart`);
    } catch { toast.error('Failed to add to cart'); }
  };

  const toggleWishlist = async () => {
    if (!user) { login(); return; }
    if (isInWishlist(product.product_id)) {
      await removeFromWishlist(product.product_id);
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(product.product_id);
      toast.success('Added to wishlist');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleImageMouseMove = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    const totalImages = product?.images?.length || 0;
    if (Math.abs(diff) > 50 && totalImages > 1) {
      if (diff > 0) setActiveImg(prev => (prev + 1) % totalImages);
      else setActiveImg(prev => (prev - 1 + totalImages) % totalImages);
    }
    touchStart.current = null;
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { login(); return; }
    setSubmittingReview(true);
    try {
      await axios.post(`${API}/reviews/${slug}`, reviewForm, { withCredentials: true });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', body: '', fit_feedback: 'True to size' });
      const rRes = await axios.get(`${API}/reviews/${slug}`);
      setReviews(rRes.data);
    } catch { toast.error('Failed to submit review. Please sign in first.'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-[3/4] bg-brand-surface animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-brand-surface animate-pulse w-3/4" />
          <div className="h-6 bg-brand-surface animate-pulse w-1/4" />
          <div className="h-24 bg-brand-surface animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <p className="font-serif text-2xl text-foreground mb-4">Product not found</p>
      <Link to="/collections" className="text-sm font-sans text-primary hover:underline">Browse collections</Link>
    </div>
  );

  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const inWishlist = isInWishlist(product.product_id);

  return (
    <div className="py-8 lg:py-12" data-testid="product-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-sans text-muted-foreground mb-8" data-testid="breadcrumb">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/collections" className="hover:text-primary transition-colors">Collections</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery with zoom + swipe */}
          <div className="space-y-4" data-testid="product-gallery">
            <div className="relative aspect-[3/4] bg-brand-surface overflow-hidden cursor-crosshair"
              ref={imgRef}
              onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleImageMouseMove}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <img src={product.images?.[activeImg]} alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-200 ${zoomed ? 'scale-[2]' : 'scale-100'}`}
                style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}} />
              {/* Image nav arrows */}
              {product.images?.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(prev => (prev - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    data-testid="gallery-prev"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setActiveImg(prev => (prev + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    data-testid="gallery-next"><ChevronRight className="w-4 h-4" /></button>
                </>
              )}
              {/* Image dots for mobile */}
              {product.images?.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                  {product.images.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-primary' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>
            {/* Thumbnails - desktop */}
            {product.images?.length > 1 && (
              <div className="hidden lg:flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-20 border overflow-hidden transition-all ${i === activeImg ? 'border-primary' : 'border-brand-border opacity-60 hover:opacity-100'}`}
                    data-testid={`thumb-${i}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-28 lg:self-start space-y-6">
            <div>
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-2">{product.category?.replace('_', ' ')}</p>
              <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground" data-testid="product-title">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3" data-testid="product-price">
              <span className="font-serif text-2xl text-primary">Rs {product.price?.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <>
                  <span className="text-sm font-sans text-muted-foreground line-through">Rs {product.compare_price?.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-sans bg-red-600 text-white px-2 py-0.5">{Math.round((1 - product.price / product.compare_price) * 100)}% off</span>
                </>
              )}
            </div>

            {reviews.total > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(reviews.average_rating) ? 'fill-primary text-primary' : 'text-brand-border'}`} />
                  ))}
                </div>
                <span className="text-xs font-sans text-muted-foreground">{reviews.average_rating} ({reviews.total} reviews)</span>
              </div>
            )}

            <p className="text-sm font-sans text-muted-foreground leading-relaxed">{product.short_description}</p>

            {/* Size Selector */}
            <div data-testid="size-selector">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-sans uppercase tracking-[0.2em] text-foreground">Size</p>
                <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="text-xs font-sans text-primary underline" data-testid="size-guide-toggle">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map(s => {
                  const stockForSize = product.size_stock?.[s];
                  const isOutOfStock = stockForSize !== undefined && stockForSize <= 0;

                  return (
                    <button key={s} onClick={() => !isOutOfStock && setSelectedSize(s)} disabled={isOutOfStock}
                      className={`min-w-[48px] h-10 px-3 text-sm font-sans border transition-all relative ${isOutOfStock ? 'opacity-40 cursor-not-allowed line-through border-brand-border text-muted-foreground' : selectedSize === s ? 'bg-primary text-primary-foreground border-primary' : 'border-brand-border text-foreground hover:border-primary'}`}
                      data-testid={`size-btn-${s}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {showSizeGuide && (
                <div className="mt-4 border border-brand-border bg-brand-surface p-4" data-testid="size-guide-table">
                  <table className="w-full text-xs font-sans">
                    <thead><tr className="border-b border-brand-border">
                      <th className="py-2 text-left text-muted-foreground">Size</th>
                      <th className="py-2 text-left text-muted-foreground">Chest</th>
                      <th className="py-2 text-left text-muted-foreground">Waist</th>
                      <th className="py-2 text-left text-muted-foreground">Shoulder</th>
                    </tr></thead>
                    <tbody>{SIZE_GUIDE.map(row => (
                      <tr key={row.size} className="border-b border-brand-border/50">
                        <td className="py-2 text-foreground font-medium">{row.size}</td>
                        <td className="py-2 text-muted-foreground">{row.chest}</td>
                        <td className="py-2 text-muted-foreground">{row.waist}</td>
                        <td className="py-2 text-muted-foreground">{row.shoulder}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                  <p className="mt-2 text-xs text-muted-foreground">Fit: {product.fit} | Model wears size M</p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div data-testid="quantity-selector">
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-foreground mb-3">Quantity</p>
              <div className="flex items-center border border-brand-border w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-brand-surface transition-colors" data-testid="qty-minus"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center text-sm font-sans" data-testid="qty-value">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-brand-surface transition-colors" data-testid="qty-plus"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all"
                data-testid="add-to-cart-btn">
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
              <div className="flex gap-3">
                <button onClick={toggleWishlist}
                  className={`flex-1 flex items-center justify-center gap-2 border px-4 py-3 text-xs font-sans uppercase tracking-[0.2em] transition-all ${inWishlist ? 'border-red-500 text-red-500' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}
                  data-testid="wishlist-btn">
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} /> {inWishlist ? 'Wishlisted' : 'Wishlist'}
                </button>
                <button onClick={handleShare}
                  className="flex items-center justify-center gap-2 border border-brand-border text-muted-foreground px-4 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:text-foreground transition-all"
                  data-testid="share-btn">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trust badges compact */}
            <TrustBadges compact />

            {/* Product Details */}
            <div className="border-t border-brand-border pt-6 space-y-4" data-testid="product-details">
              <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-primary">Product Details</h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">{product.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                <div><span className="text-muted-foreground">Fabric:</span> <span className="text-foreground">{product.fabric}</span></div>
                <div><span className="text-muted-foreground">Color:</span> <span className="text-foreground">{product.color}</span></div>
                <div><span className="text-muted-foreground">Fit:</span> <span className="text-foreground">{product.fit}</span></div>
                <div><span className="text-muted-foreground">Lining:</span> <span className="text-foreground">{product.lining || 'Standard'}</span></div>
              </div>
              {product.care && (
                <div className="bg-brand-surface border border-brand-border p-4" data-testid="care-instructions">
                  <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-foreground mb-2">Care Instructions</h4>
                  <p className="text-sm font-sans text-muted-foreground">{product.care}</p>
                </div>
              )}
            </div>

            {/* Delivery info */}
            <div className="flex flex-col gap-2 text-xs font-sans text-muted-foreground border-t border-brand-border pt-4">
              <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-primary" /> Free shipping on orders above Rs 5,000</div>
              <div className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5 text-primary" /> 14-day easy returns & exchanges</div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Authenticity guaranteed</div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16 lg:mt-24 border-t border-brand-border pt-12" data-testid="reviews-section">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-foreground">Customer Reviews ({reviews.total})</h2>
            <button onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-xs font-sans uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-all"
              data-testid="write-review-btn">
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="max-w-lg mb-10 space-y-4 bg-brand-surface border border-brand-border p-6" data-testid="review-form">
              <div>
                <label className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                      className="p-0.5" data-testid={`rating-star-${s}`}>
                      <Star className={`w-6 h-6 ${s <= reviewForm.rating ? 'fill-primary text-primary' : 'text-brand-border'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Review title" required value={reviewForm.title} onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-brand-bg border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <textarea placeholder="Your review" required rows={3} value={reviewForm.body} onChange={e => setReviewForm(p => ({ ...p, body: e.target.value }))}
                className="w-full bg-brand-bg border border-brand-border px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              <select value={reviewForm.fit_feedback} onChange={e => setReviewForm(p => ({ ...p, fit_feedback: e.target.value }))}
                className="w-full bg-brand-bg border border-brand-border px-4 py-3 text-sm font-sans text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="True to size">True to size</option>
                <option value="Slightly small">Slightly small</option>
                <option value="Slightly large">Slightly large</option>
                <option value="Very small">Very small</option>
                <option value="Very large">Very large</option>
              </select>
              <button type="submit" disabled={submittingReview}
                className="w-full bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] disabled:opacity-50" data-testid="submit-review-btn">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews list */}
          {reviews.total > 0 ? (
            <div className="space-y-6 max-w-2xl">
              {reviews.reviews.map(r => (
                <div key={r.review_id} className="border-b border-brand-border pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-primary text-primary' : 'text-brand-border'}`} />)}</div>
                    <span className="text-xs font-sans text-muted-foreground">{r.user_name}</span>
                  </div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-1">{r.title}</h4>
                  <p className="text-sm font-sans text-muted-foreground">{r.body}</p>
                  {r.fit_feedback && <p className="text-xs font-sans text-primary mt-1">Fit: {r.fit_feedback}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-sans text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 lg:mt-24 border-t border-brand-border pt-12" data-testid="related-products">
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-foreground mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewed items={recentItems.filter(i => i.slug !== slug)} />
      </div>

      {/* Sticky Add to Cart - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-bg/95 backdrop-blur-sm border-t border-brand-border p-3 lg:hidden" data-testid="sticky-add-to-cart">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-sans text-foreground truncate">{product.name}</p>
            <p className="text-sm font-sans text-primary font-medium">Rs {product.price?.toLocaleString('en-IN')}</p>
          </div>
          <button onClick={handleAddToCart}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.15em] shrink-0"
            data-testid="sticky-add-btn">
            <ShoppingBag className="w-4 h-4" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
