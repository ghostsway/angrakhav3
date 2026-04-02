import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlist([]); return; }
    try {
      const res = await axios.get(`${API}/wishlist`, { withCredentials: true });
      setWishlist(res.data.items || []);
    } catch { setWishlist([]); }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const addToWishlist = async (productId) => {
    if (!user) return false;
    try {
      await axios.post(`${API}/wishlist/${productId}`, {}, { withCredentials: true });
      await fetchWishlist();
      return true;
    } catch { return false; }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;
    try {
      await axios.delete(`${API}/wishlist/${productId}`, { withCredentials: true });
      setWishlist(prev => prev.filter(i => i.product_id !== productId));
      return true;
    } catch { return false; }
  };

  const isInWishlist = (productId) => wishlist.some(i => i.product_id === productId);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
