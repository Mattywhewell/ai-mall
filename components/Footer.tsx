'use client';

import Link from 'next/link';
import { Mail, MapPin, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold text-white">AI Mall</span>
            </div>
            <p className="text-sm text-gray-400">
              The world's first AI-native marketplace with emotional intelligence
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>San Francisco, CA</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Mail className="w-4 h-4" />
              <span>hello@ai-mall.com</span>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/vendor-registration" className="hover:text-white transition-colors">
                  Become a Creator
                </Link>
              </li>
              <li>
                <Link href="/ai-concierge" className="hover:text-white transition-colors">
                  AI Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/city" className="hover:text-white transition-colors">
                  City Explorer
                </Link>
              </li>
              <li>
                <Link href="/districts" className="hover:text-white transition-colors">
                  Districts
                </Link>
              </li>
              <li>
                <Link href="/chapels" className="hover:text-white transition-colors">
                  Chapels
                </Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-white transition-colors">
                  Live Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} AI-Native Mall. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-gray-400">🔒 Secure Payments via Stripe</span>
              <span className="text-gray-400">🤖 Powered by AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
