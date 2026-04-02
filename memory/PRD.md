# Angarakha E-Commerce Platform - PRD

## Original Problem Statement
Convert an ethnic wear store template ("Vaayu") to "Angarakha" (Agarwal's Angarakha, Jaipur). Build a full-featured e-commerce platform with 40+ advanced features.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Shadcn/UI, Framer Motion
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Integrations**: Telegram Bot API, Resend Email, Razorpay (mocked)

## Architecture
```
/app/backend/
  server.py                 # Main FastAPI app (routes, DB, integrations)
  routes/                   # Modular route files
    wishlist.py, addresses.py, profile.py, search_enhanced.py,
    inventory.py, returns.py, abandoned_cart.py, giftcards.py, referral.py
  .env                      # MongoDB, Telegram, Resend, Razorpay config

/app/frontend/src/
  components/               # Header, Footer, ProductCard, FilterSidebar, SearchAutocomplete, TrustBadges, FreeShippingBar, EmailPopup, BackToTop, RecentlyViewed
  pages/                    # Home, ProductPage, CollectionPage, Search, Checkout, OrderConfirmation, Account, Wishlist, GiftCards, Returns, SalePage, Admin, Contact, About, Legal
  contexts/                 # AuthContext, CartContext, WishlistContext
  hooks/                    # useRecentlyViewed
```

## Implemented Features (as of 2026-04-02)

### Core E-Commerce
- [x] Full branding (Angarakha, Jaipur details)
- [x] Product catalog with 12 seed products
- [x] Product pages with gallery, size selector, quantity
- [x] Cart system (guest + authenticated)
- [x] Checkout with coupon support
- [x] Order confirmation page
- [x] Telegram + Resend order notifications

### Phase 1: Quick Wins
- [x] Free shipping bar (Rs 5,000 threshold)
- [x] Trust badges (Secure Checkout, Free Shipping, Easy Returns, Safe Payments)
- [x] Product badges (New, Bestseller, Sale/% Off, Sold Out)
- [x] Back-to-top button
- [x] Sticky Add to Cart on mobile
- [x] Breadcrumbs navigation
- [x] Social sharing on product pages
- [x] Recently viewed products
- [x] Email capture popup (10% off first order)
- [x] Care instructions on product pages

### Phase 2: High-Impact Features
- [x] Product Reviews & Ratings (view + write)
- [x] Wishlist functionality (context + page)
- [x] Advanced Filters (price range, size, color, fabric, occasion, sort)
- [x] Related/recommended products
- [x] Search autocomplete with suggestions
- [x] Popular searches
- [x] No results page with alternatives
- [x] Product image zoom (hover on desktop)
- [x] Touch gestures (swipe images on mobile)
- [x] Multiple images gallery with thumbnails
- [x] Size guide with measurements

### Phase 3: Major Features
- [x] Abandoned Cart recovery (admin panel + email reminders)
- [x] Inventory management (stock per size, low stock alerts, out of stock badges)
- [x] Gift cards (purchase, check balance)
- [x] Referral program (unique codes, 10% discount)
- [x] Return/Exchange portal (self-service)
- [x] Multiple saved addresses
- [x] Order history with reorder button
- [x] Profile management (edit name, phone)
- [x] Sale/Clearance page
- [x] Category-based contact form

### Admin Panel
- [x] Dashboard with analytics
- [x] Products CRUD
- [x] Orders management
- [x] Collections management
- [x] Coupons management
- [x] Inventory management (stock by size, low stock alerts)
- [x] Returns management (approve/reject)
- [x] Abandoned carts with email reminders
- [x] Gift cards tracking
- [x] Referrals tracking
- [x] Enquiries, Customers, Newsletter, CMS

## Mocked / Pending
- [ ] Razorpay payment (mocked - awaiting live keys)
- [ ] Customer behavior heatmaps (requires analytics integration)
- [ ] Conversion funnel analytics (basic version in dashboard)
- [ ] Revenue forecasting (requires more data)

## P0 Remaining
- Razorpay live integration (user needs to provide keys)

## P1 Backlog
- Auto-send abandoned cart emails on cron schedule
- Enhanced analytics dashboard with charts
- Customer segmentation

## P2 Backlog
- Gift wrapping / personalized messages
- Loyalty points system
