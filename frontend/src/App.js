import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreeShippingBar from '@/components/FreeShippingBar';
import EmailPopup from '@/components/EmailPopup';
import BackToTop from '@/components/BackToTop';
import Home from '@/pages/Home';
import Collections from '@/pages/Collections';
import CollectionPage from '@/pages/CollectionPage';
import ProductPage from '@/pages/ProductPage';
import SearchPage from '@/pages/Search';
import CartPage from '@/pages/CartPage';
import Checkout from '@/pages/Checkout';
import OrderConfirmation from '@/pages/OrderConfirmation';
import Account from '@/pages/Account';
import Contact from '@/pages/Contact';
import About from '@/pages/About';
import AuthCallback from '@/pages/AuthCallback';
import Legal from '@/pages/Legal';
import Admin from '@/pages/Admin';
import AdminLogin from '@/pages/AdminLogin';
import WishlistPage from '@/pages/Wishlist';
import GiftCards from '@/pages/GiftCards';
import Returns from '@/pages/Returns';
import SalePage from '@/pages/SalePage';

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Header />
      <FreeShippingBar />
      <main className="min-h-screen pt-16 lg:pt-20">
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
        </Routes>
      </main>
      <Footer />
      <EmailPopup />
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
