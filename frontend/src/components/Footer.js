import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-bg border-t border-brand-border" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="font-serif text-3xl font-light tracking-[0.15em] text-foreground mb-4">ANGARAKHA</h2>
            <p className="text-sm font-sans text-muted-foreground leading-relaxed max-w-xs">
              Traditional and modern ethnic wear from the heart of Jaipur. Heritage technique meets contemporary design.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-6">Shop</h3>
            <nav className="flex flex-col gap-3">
              <Link to="/collections/wedding" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-wedding">Wedding Collection</Link>
              <Link to="/collections/festive" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-festive">Festive Collection</Link>
              <Link to="/collections/casual" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-casual">Casual Collection</Link>
              <Link to="/collections/new-arrivals" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-new">New Arrivals</Link>
              <Link to="/collections/all" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-all">All Products</Link>
            </nav>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-6">Information</h3>
            <nav className="flex flex-col gap-3">
              <Link to="/about" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-about">Our Story</Link>
              <Link to="/contact" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-contact">Contact</Link>
              <Link to="/gift-cards" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-giftcards">Gift Cards</Link>
              <Link to="/sale" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-sale">Sale & Clearance</Link>
              <Link to="/returns" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-returns">Returns & Exchanges</Link>
              <Link to="/legal/shipping" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">Shipping Policy</Link>
              <Link to="/legal/privacy" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms" className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-primary mb-6">Visit Us</h3>
            <div className="flex flex-col gap-3 text-sm font-sans text-muted-foreground">
              <p>Building No. 11<br />Ghee Walo Ka Rasta<br />Johri Bazar, Jaipur-302001<br />Rajasthan</p>
              <p>Daily: 10:30 AM - 9:30 PM</p>
              <a href="tel:+919828541068" className="hover:text-primary transition-colors">+91 98285 41068</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-sans text-muted-foreground tracking-wide">
            &copy; {new Date().getFullYear()} Angarakha. All rights reserved.
          </p>
          <p className="text-xs font-sans text-muted-foreground tracking-[0.2em] uppercase">
            Handcrafted in Jaipur
          </p>
        </div>
      </div>
    </footer>
  );
}
