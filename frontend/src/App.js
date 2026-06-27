import '@/App.css';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreeShippingBar from '@/components/FreeShippingBar';
import EmailPopup from '@/components/EmailPopup';
import BackToTop from '@/components/BackToTop';

const Home = lazy(() => import('@/pages/Home'));
const Collections = lazy(() => import('@/pages/Collections'));
const CollectionPage = lazy(() => import('@/pages/CollectionPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const SearchPage = lazy(() => import('@/pages/Search'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'));
const Account = lazy(() => import('@/pages/Account'));
const Contact = lazy(() => import('@/pages/Contact'));
const About = lazy(() => import('@/pages/About'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Legal = lazy(() => import('@/pages/Legal'));
const Admin = lazy(() => import('@/pages/Admin'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const WishlistPage = lazy(() => import('@/pages/Wishlist'));
const GiftCards = lazy(() => import('@/pages/GiftCards'));
const Returns = lazy(() => import('@/pages/Returns'));
const SalePage = lazy(() => import('@/pages/SalePage'));

const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="font-serif text-5xl font-light mb-4">404</h1>
    <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
    <Link to="/" className="bg-primary text-primary-foreground px-8 py-3 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all">
      Return Home
    </Link>
  </div>
);

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header />}
      {!isAdminRoute && <FreeShippingBar />}
      <main className={`min-h-screen ${isAdminRoute ? '' : 'pt-16 lg:pt-20'}`}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/orders" element={<Account />} />
            <Route path="/account/addresses" element={<Account />} />
            <Route path="/account/returns" element={<Account />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal/:page" element={<Legal />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/:tab" element={<Admin />} />
            <Route path="/gift-cards" element={<GiftCards />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/sale" element={<SalePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <EmailPopup />}
      <BackToTop />
      <Toaster position="bottom-right" />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRouter />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
