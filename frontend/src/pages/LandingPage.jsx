import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORY_ICONS = {
  Laptop: '💻', Desktop: '🖥️', RAM: '🧠', SSD: '💾', HDD: '🗄️',
  Router: '📡', Pendrive: '🔌', Monitor: '🖥️', Keyboard: '⌨️', Mouse: '🖱️',
  Printer: '🖨️', GPU: '🎮', CPU: '⚙️', Motherboard: '🔧', 'Power Supply': '⚡',
  Cooling: '❄️', Cable: '🔗', Accessory: '🎒', Other: '📦',
};

function LandingPage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await axios.get('/api/products?page=0&size=6');
        setFeaturedProducts(res.data.content?.slice(0, 6) || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    loadFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Tech Products You Can Trust
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-3 leading-relaxed">
                Discover a curated selection of high-quality laptops, components, and accessories. From budget-friendly to premium options, we've got everything you need.
              </p>
              <p className="text-base text-blue-100 mb-8">
                Fast shipping, competitive prices, and customer support you can count on.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/catalogue" className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl text-center">
                  Shop Now
                </Link>
                <a href="#featured" className="px-6 py-3 border border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-center">
                  View Featured
                </a>
              </div>
            </div>

            {/* Right: Hero Image/Icon */}
            <div className="hidden md:flex items-center justify-center">
              <div className="text-9xl animate-bounce">🛍️</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-50 dark:bg-slate-800 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">100+</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Products In Stock</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">5⭐</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Customer Rated</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">24/7</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Customer Support</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">Featured Products</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Handpicked selection of popular items</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading products…</div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <p className="mb-4">No products available yet.</p>
              <Link to="/catalogue" className="text-blue-600 hover:underline">Browse all products →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredProducts.map((product) => {
                const icon = CATEGORY_ICONS[product.category] || '📦';
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.productId}`)}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <div className="h-48 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      {product.imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${product.imageBase64}`} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">{icon}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded">
                          {product.category}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          product.stock > 0
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                        }`}>
                          {product.stock > 0 ? 'In Stock' : 'Out'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1 line-clamp-2">{product.name}</h3>
                      {product.brand && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{product.brand}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-800 dark:text-white">
                          £{product.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.productId}`); }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center">
            <Link to="/catalogue" className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow">
              Explore All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {['Laptop', 'Desktop', 'RAM', 'SSD', 'GPU', 'Monitor', 'Keyboard', 'Mouse'].map((cat) => (
              <Link
                key={cat}
                to={`/catalogue`}
                className="bg-white dark:bg-slate-700 p-6 rounded-2xl text-center hover:shadow-lg hover:scale-105 transition-all border border-slate-100 dark:border-slate-600"
              >
                <div className="text-4xl mb-2">{CATEGORY_ICONS[cat] || '📦'}</div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{cat}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Verified Quality</h3>
              <p className="text-slate-600 dark:text-slate-400">All products are tested and verified before shipping to ensure utmost quality.</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900">
              <div className="text-4xl mb-3">🚚</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Fast Shipping</h3>
              <p className="text-slate-600 dark:text-slate-400">We ship orders quickly with reliable carriers across the UK and beyond.</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Secure Payments</h3>
              <p className="text-slate-600 dark:text-slate-400">Your payment information is encrypted and protected with industry-standard security.</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Expert Support</h3>
              <p className="text-slate-600 dark:text-slate-400">Our knowledgeable team is here to help with product recommendations and support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to upgrade your tech?</h2>
          <p className="text-lg text-blue-100 mb-8">Start shopping now and find the perfect products for your needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catalogue" className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Start Shopping
            </Link>
            <a href="#featured" className="px-8 py-3 border border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
              See Featured Items
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
