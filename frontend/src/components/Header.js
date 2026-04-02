import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, Heart, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SearchAutocomplete from '@/components/SearchAutocomplete';

const NAV_LINKS = [
  { label: 'Collections', to: '/collections' },
  { label: 'Wedding', to: '/collections/wedding' },
  { label: 'Festive', to: '/collections/festive' },
  { label: 'Sale', to: '/sale' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Header() {
  const { user, login } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close search on route change
  useEffect(() => { setSearchOpen(false); }, [location]);

  return (
    <>
      <header className="glass-header fixed top-0 left-0 right-0 z-50 border-b border-brand-border" data-testid="site-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop nav row */}
          <div className="hidden lg:flex items-center justify-center gap-8 py-2 border-b border-brand-border/50">
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className={`text-[11px] font-sans uppercase tracking-[0.2em] transition-colors ${location.pathname === link.to ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                data-testid={`nav-${link.label.toLowerCase()}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between h-16 lg:h-14">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-foreground" data-testid="mobile-menu-btn">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-brand-bg border-brand-border w-[280px]">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl font-light tracking-[0.25em] text-foreground">ANGARAKHA</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-6">
                  {NAV_LINKS.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                      className="text-sm font-sans uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`mobile-nav-${link.label.toLowerCase()}`}>
                      {link.label}
                    </Link>
                  ))}
                  <Link to="/gift-cards" onClick={() => setMobileOpen(false)} className="text-sm font-sans uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Gift Cards</Link>
                  <Link to="/returns" onClick={() => setMobileOpen(false)} className="text-sm font-sans uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Returns</Link>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex-1 flex justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2" data-testid="logo-link">
              <h1 className="font-serif text-xl lg:text-2xl font-light tracking-[0.2em] text-foreground">ANGARAKHA</h1>
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-muted-foreground hover:text-primary transition-colors" data-testid="search-icon">
                {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
              <Link to="/wishlist" className="p-2 text-muted-foreground hover:text-primary transition-colors relative" data-testid="wishlist-icon">
                <Heart className="w-4 h-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-sans font-medium rounded-full flex items-center justify-center">{wishlistCount}</span>
                )}
              </Link>
              {user ? (
                <Link to="/account" className="p-2 text-muted-foreground hover:text-primary transition-colors" data-testid="account-icon">
                  <User className="w-4 h-4" />
                </Link>
              ) : (
                <button onClick={login} className="p-2 text-muted-foreground hover:text-primary transition-colors" data-testid="login-btn">
                  <User className="w-4 h-4" />
                </button>
              )}
              <Link to="/cart" className="p-2 text-muted-foreground hover:text-primary transition-colors relative" data-testid="cart-icon">
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-sans font-medium rounded-full flex items-center justify-center" data-testid="cart-count">{itemCount}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed top-[64px] lg:top-[92px] left-0 right-0 z-40 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border p-4" data-testid="search-overlay">
          <div className="max-w-2xl mx-auto">
            <SearchAutocomplete onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
