/**
 * Supplier Navigation Component
 * Sidebar navigation for supplier portal
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Settings, LogOut } from 'lucide-react';

export default function SupplierNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/supplier',
      icon: LayoutDashboard,
    },
    {
      name: 'Products',
      href: '/supplier/products',
      icon: Package,
    },
    {
      name: 'Orders',
      href: '/supplier/orders',
      icon: ShoppingCart,
    },
    {
      name: 'Analytics',
      href: '/supplier/analytics',
      icon: TrendingUp,
    },
    {
      name: 'Settings',
      href: '/supplier/settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/supplier') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bg-white/5 backdrop-blur-sm border-r border-white/10 w-64 min-h-screen p-4">
      <div className="mb-8">
        <Link href="/supplier" className="flex items-center gap-2 text-white">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold">
            S
          </div>
          <div>
            <p className="font-semibold">Supplier Portal</p>
            <p className="text-xs text-gray-400">Manage your store</p>
          </div>
        </Link>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all w-full">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
