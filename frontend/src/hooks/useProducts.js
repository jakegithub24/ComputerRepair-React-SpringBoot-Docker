import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Hook for managing product data fetching and caching
 * Handles pagination, search, and category filtering
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /**
   * Fetch all products with pagination
   */
  const fetchAllProducts = async (page = 0, size = 20, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/products?page=${page}&size=${size}`);
      setProducts(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 0);
      return res.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
      return { content: [], totalElements: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search products by query string
   */
  const searchProducts = async (query, page = 0, size = 20) => {
    if (!query.trim()) return { content: [], totalElements: 0, totalPages: 0 };

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/products/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
      setProducts(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 0);
      return res.data;
    } catch (err) {
      setError(err.message || 'Failed to search products');
      setProducts([]);
      return { content: [], totalElements: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get products by category
   */
  const getByCategory = async (category, page = 0, size = 20) => {
    if (!category) return { content: [], totalElements: 0, totalPages: 0 };

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `/api/products/category/${encodeURIComponent(category)}?page=${page}&size=${size}`
      );
      setProducts(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 0);
      return res.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch category products');
      setProducts([]);
      return { content: [], totalElements: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get single product by ID
   */
  const getProductById = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/products/${productId}`);
      return res.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch product');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get featured products (first page)
   */
  const getFeaturedProducts = async (size = 6) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/products?page=0&size=${size}`);
      return res.data.content || [];
    } catch (err) {
      setError(err.message || 'Failed to fetch featured products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    totalElements,
    totalPages,
    fetchAllProducts,
    searchProducts,
    getByCategory,
    getProductById,
    getFeaturedProducts,
  };
}
