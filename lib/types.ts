export interface Microstore {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  image_url: string;
  tags: string[];
  category?: string;
  rating?: number;
  stock_quantity?: number;
  microstore_id: string;
  created_at: string;
}

// Extended types for new features

export interface Vendor {
  id: string;
  microstore_id: string;
  owner_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  microstore?: Microstore;
}

export interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shipping_address: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Analytics {
  id: string;
  event_type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'search';
  product_id?: string;
  microstore_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CartItemDB {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface ProductSEO {
  id: string;
  product_id: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  og_title: string;
  og_description: string;
  created_at: string;
}

export interface ProductSocial {
  id: string;
  product_id: string;
  tiktok_hook: string;
  instagram_caption: string;
  tweet: string;
  hashtags: string[];
  created_at: string;
}
