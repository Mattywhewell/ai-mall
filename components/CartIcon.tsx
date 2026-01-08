'use client';

import { useCartStore } from '@/lib/store/cartStore';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

function CartIcon() {
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const totalItems = getTotalItems();

  return (
    <Link
      href="/cart"
      className="relative p-2 text-gray-700 hover:text-indigo-600 transition"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Link>
  );
}

export default CartIcon;
export { CartIcon };
