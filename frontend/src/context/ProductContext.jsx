import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});

  // Fetch all products with optional caching
  const fetchAllProducts = useCallback(async (useCache = true) => {
    if (useCache && cache.all) {
      setProducts(cache.all);
      return cache.all;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/products?page=0&size=1000');
      const data = res.data.content || [];
      setProducts(data);
      setCache((prev) => ({ ...prev, all: data }));
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Search products by name
  const searchProducts = useCallback(async (query) => {
    if (!query) return products;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/products/search?query=${encodeURIComponent(query)}`);
      return res.data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Get products by category
  const getByCategory = useCallback(async (category) => {
    const cacheKey = `category_${category}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/products/category/${encodeURIComponent(category)}`);
      const data = res.data;
      setCache((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Get single product by ID
  const getProductById = useCallback(async (productId) => {
    const cacheKey = `product_${productId}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    setError(null);
    try {
      const res = await axios.get(`/api/products/${productId}`);
      const data = res.data;
      setCache((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [cache]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
    setProducts([]);
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        fetchAllProducts,
        searchProducts,
        getByCategory,
        getProductById,
        clearCache,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }
  return context;
}

export default ProductContext;
