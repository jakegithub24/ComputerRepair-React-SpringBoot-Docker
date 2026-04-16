import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = {
  Laptop: '💻', Desktop: '🖥️', RAM: '🧠', SSD: '💾', HDD: '🗄️',
  Router: '📡', Pendrive: '🔌', Monitor: '🖥️', Keyboard: '⌨️', Mouse: '🖱️',
  Printer: '🖨️', GPU: '🎮', CPU: '⚙️', Motherboard: '🔧', 'Power Supply': '⚡',
  Cooling: '❄️', Cable: '🔗', Accessory: '🎒', Other: '📦',
};

function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/products/${productId}`);
        setProduct(res.data);

        // Load related products (same category)
        if (res.data.category) {
          try {
            const relRes = await axios.get(`/api/products/category/${res.data.category}?page=0&size=4`);
            setRelatedProducts(relRes.data.content?.filter(p => p.productId !== productId).slice(0, 3) || []);
          } catch { /* ignore */ }
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load product');
        setTimeout(() => navigate('/catalogue'), 2000);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setAdding(true);
    try {
      await axios.post('/api/cart', { productId: product.productId, quantity });
      toast.success(`✅ Added ${quantity} item(s) to cart`);
      setQuantity(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading product…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Product not found</p>
          <button type="button" onClick={() => navigate('/catalogue')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const icon = CATEGORY_ICONS[product.category] || '📦';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <button type="button" onClick={() => navigate('/catalogue')} className="text-blue-600 hover:underline text-sm mb-6 flex items-center gap-1">
        ← Back to Shop
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden h-96 flex items-center justify-center">
          {product.imageBase64 ? (
            <img src={`data:image/jpeg;base64,${product.imageBase64}`} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{icon}</span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-semibold rounded-full">
              {product.productId}
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
              {product.category}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              product.stock > 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{product.name}</h1>

          {/* Brand & Model */}
          {(product.brand || product.model) && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {product.brand && <span>{product.brand}</span>}
              {product.brand && product.model && <span> • </span>}
              {product.model && <span>{product.model}</span>}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">Description</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Specs */}
          {product.specs && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">Specifications</h3>
              <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-slate-700 dark:text-slate-300 overflow-x-auto max-w-full break-words whitespace-pre-wrap">{product.specs}</pre>
            </div>
          )}

          {/* Price & Add to Cart */}
          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-baseline justify-between mb-6">
              <span className="text-4xl font-bold text-slate-800 dark:text-white">
                £{product.price.toFixed(2)}
              </span>
              {product.available && (
                <span className="text-xs text-slate-500 dark:text-slate-400">Available now</span>
              )}
            </div>

            {product.stock > 0 ? (
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-12 text-center bg-transparent text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 py-2.5 font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? '⏳' : '🛒'} {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            ) : (
              <button disabled className="w-full py-2.5 font-semibold bg-gray-400 text-white rounded-lg cursor-not-allowed">
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Related Products</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Other items in {product.category}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/product/${item.productId}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <div className="h-40 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  {item.imageBase64 ? (
                    <img src={`data:image/jpeg;base64,${item.imageBase64}`} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{CATEGORY_ICONS[item.category] || '📦'}</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-2 mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      £{item.price.toFixed(2)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.stock > 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                    }`}>
                      {item.stock > 0 ? 'In stock' : 'Out'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetailsPage;
