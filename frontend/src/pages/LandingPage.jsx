import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const SERVICES = [
  { icon: '🛒', name: 'Buy', description: 'Looking for a laptop or computer? We source quality devices at great prices.' },
  { icon: '💰', name: 'Sell', description: 'Sell your old device to us quickly and hassle-free.' },
  { icon: '⚡', name: 'Upgrade', description: 'Boost your machine with RAM, SSD, or other hardware upgrades.' },
  { icon: '🔧', name: 'Repair', description: 'Screen replacements, motherboard repairs, virus removal, and more.' },
  { icon: '💬', name: 'General Enquiry', description: "Not sure what you need? Send us a message and we'll help." },
];

function LandingPage() {
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <span className="font-bold text-lg text-slate-800 dark:text-white">TechFix</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <Link
              to="/login"
              className="px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Your Local Tech Experts
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Laptop and computer repairs, upgrades, and trade-ins. Whether you need a quick fix or a full system overhaul, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              Get Started
            </Link>
            <a
              href="#services"
              className="px-6 py-3 border border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Our Services
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-2">Our Services</h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-10">Everything your device needs, under one roof.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{service.icon}</div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">{service.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-white dark:bg-slate-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Contact Us</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">We're here to help. Reach out anytime.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:contact@techfixrepair.com"
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              📧 contact@techfixrepair.com
            </a>
            <a
              href="tel:+441234567890"
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              📞 +44 1234 567890
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} TechFix Repair Shop. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
