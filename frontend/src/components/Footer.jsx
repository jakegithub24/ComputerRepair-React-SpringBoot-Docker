import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🛍️</span>
              <span className="font-bold text-slate-800 dark:text-white">TechShop</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Your one-stop shop for laptops, components, and tech accessories.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Shop</h3>
            <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/catalogue" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">💻 Laptops &amp; Desktops</Link></li>
              <li><Link to="/catalogue" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">🧠 RAM &amp; Storage</Link></li>
              <li><Link to="/catalogue" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">🎮 GPUs &amp; CPUs</Link></li>
              <li><Link to="/catalogue" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">🖥️ Monitors &amp; Accessories</Link></li>
            </ul>
          </div>

          {/* Contact + Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Contact</h3>
            <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="mailto:support@techshop.com" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  📧 support@techshop.com
                </a>
              </li>
              <li>
                <a href="tel:+441234567890" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  📞 +44 1234 567890
                </a>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <Link to="/login" className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Login</Link>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Link to="/register" className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Register</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} TechShop. All rights reserved.
          </p>
          <p className="text-xs text-slate-300 dark:text-slate-600">
            Built with ❤️ for your tech needs
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
