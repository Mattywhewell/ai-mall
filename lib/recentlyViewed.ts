// Recently Viewed Products Tracker
import { Product } from './types';

const STORAGE_KEY = 'aiverse_recently_viewed';
const MAX_ITEMS = 12;

export const recentlyViewedManager = {
  // Add a product to recently viewed
  addProduct: (product: Product) => {
    if (typeof window === 'undefined') return;

    try {
      const existing = recentlyViewedManager.getProducts();
      
      // Remove if already exists
      const filtered = existing.filter(p => p.id !== product.id);
      
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving to recently viewed:', error);
    }
  },

  // Get all recently viewed products
  getProducts: (): Product[] => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading recently viewed:', error);
      return [];
    }
  },

  // Clear all recently viewed
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  // Remove a specific product
  removeProduct: (productId: string) => {
    if (typeof window === 'undefined') return;

    try {
      const existing = recentlyViewedManager.getProducts();
      const updated = existing.filter(p => p.id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing from recently viewed:', error);
    }
  },
};
