import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Laptop', 'Desktop', 'RAM', 'SSD', 'HDD', 'Router', 'Pendrive',
  'Monitor', 'Keyboard', 'Mouse', 'Printer', 'GPU', 'CPU', 'Motherboard',
  'Power Supply', 'Cooling', 'Cable', 'Accessory', 'Other'];

const CATEGORY_ICONS = {
  Laptop: '💻', Desktop: '🖥️', RAM: '🧠', SSD: '💾', HDD: '🗄️',
  Router: '📡', Pendrive: '🔌', Monitor: '🖥️', Keyboard: '⌨️', Mouse: '🖱️',
  Printer: '🖨️', GPU: '🎮', CPU: '⚙️', Motherboard: '🔧', 'Power Supply': '⚡',
  Cooling: '❄️', Cable: '🔗', Accessory: '🎒', Other: '📦',
};

function ProductCard({ item, onAddToCart, isLoggedIn, onViewDetails }) {
  const [expanded, setExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const icon = CATEGORY_ICONS[item.category] || '📦';

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      return;
    }
    onAddToCart(item.productId, quantity);
    setQuantity(1);
  };

  return (
    <div
      onClick={() => onViewDetails(item.productId)}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all cursor-pointer hover:scale-105 flex flex-col"
    >
      {/* Image or placeholder */}
      <div className="h-44 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
        {item.imageBase64 ? (
          <img src={`data:image/jpeg;base64,${item.imageBase64}`} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">{icon}</span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Product ID badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-semibold rounded">
            {item.productId}
          </span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
            {item.category}
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1 line-clamp-2">{item.name}</h3>

        {item.brand && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{item.brand}{item.model ? ` · ${item.model}` : ''}</p>
        )}

        {item.description && (
          <p className={`text-xs text-slate-500 dark:text-slate-400 mb-2 ${expanded ? '' : 'line-clamp-2'}`}>
            {item.description}
          </p>
        )}
        {item.description && item.description.length > 80 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="text-xs text-blue-500 hover:underline mb-2 text-left"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              £{item.price.toFixed(2)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              item.stock > 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {item.stock > 0 && (
            <div className="flex gap-2 items-center mb-3">
              <input
                type="number"
                min="1"
                max={item.stock}
                value={quantity}
                onChange={(e) => { e.stopPropagation(); setQuantity(Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1))); }}
                className="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                🛒 Add to Cart
              </button>
            </div>
          )}
          
          {item.stock === 0 && (
            <button disabled className="w-full py-2 text-xs font-semibold bg-gray-400 text-white rounded-xl cursor-not-allowed">
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CataloguePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/products?page=0&size=100');
      setItems(res.data.content || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddToCart = async (productId, quantity) => {
    try {
      await axios.post('/api/cart', { productId, quantity });
      toast.success(`✅ Added ${quantity} item(s) to cart`);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add to cart');
      }
    }
  };

  const filtered = items
    .filter(i => category === 'All' || i.category === category)
    .filter(i => {
      const q = search.toLowerCase();
      return !q || i.name.toLowerCase().includes(q) || i.productId.toLowerCase().includes(q)
        || (i.brand || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Shop</h1>
        <p className="text-slate-500 dark:text-slate-400">Browse our range of products and add them to your cart.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, brand…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="name">Sort: Name</option>
          <option value="price-asc">Sort: Price ↑</option>
          <option value="price-desc">Sort: Price ↓</option>
          <option value="stock">Sort: In Stock</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} type="button" onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}>
            {CATEGORY_ICONS[cat] || ''} {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <div className="text-5xl mb-3">🔍</div>
          <p>No products found.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                isLoggedIn={isAuthenticated}
                onViewDetails={(productId) => navigate(`/product/${productId}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CataloguePage;
