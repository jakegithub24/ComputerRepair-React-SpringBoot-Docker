import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Laptop', 'Desktop', 'RAM', 'SSD', 'HDD', 'Router', 'Pendrive',
  'Monitor', 'Keyboard', 'Mouse', 'Printer', 'GPU', 'CPU', 'Motherboard',
  'Power Supply', 'Cooling', 'Cable', 'Accessory', 'Other'];

const EMPTY_FORM = {
  name: '', category: 'Laptop', description: '', price: '', stock: '',
  brand: '', model: '', specs: '', imageBase64: '', available: true,
};

function AdminCatalogue() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/products?page=0&size=1000', { headers });
      setItems(res.data.content || []);
    } catch { toast.error('Failed to load products.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      name: item.name || '',
      category: item.category || 'Laptop',
      description: item.description || '',
      price: item.price ?? '',
      stock: item.stock ?? '',
      brand: item.brand || '',
      model: item.model || '',
      specs: item.specs || '',
      imageBase64: '',  // don't pre-fill image
      available: item.available === 1,
    });
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setForm(p => ({ ...p, imageBase64: base64 }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      brand: form.brand || null,
      model: form.model || null,
      specs: form.specs || null,
      imageBase64: form.imageBase64 || null,
      available: form.available,
    };
    try {
      if (editItem) {
        await axios.put(`/api/admin/products/${editItem.id}`, payload, { headers });
        toast.success(`✅ "${form.name}" updated`);
      } else {
        await axios.post('/api/admin/products', payload, { headers });
        toast.success(`✅ "${form.name}" added`);
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally { setSaving(false); }
  }

  async function handleDelete(id, name) {
    try {
      await axios.delete(`/api/admin/products/${id}`, { headers });
      toast.success(`🗑️ "${name}" deleted`);
      setDeleteConfirm(null);
      load();
    } catch { toast.error('Failed to delete product.'); }
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || i.productId.toLowerCase().includes(q)
      || (i.brand || '').toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
  });

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
          <span className="text-xs text-slate-400 dark:text-slate-500">{filtered.length} items</span>
        </div>
        <button type="button" onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
          + Add Product
        </button>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Remove <strong className="text-slate-700 dark:text-slate-200">{deleteConfirm.name}</strong> ({deleteConfirm.productId}) from the catalogue?
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm">Delete</button>
              <button type="button" onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editItem ? `Edit: ${editItem.name}` : 'Add New Product'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Product Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required placeholder="e.g. Dell XPS 15 Laptop" />
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Brand</label>
                <input type="text" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} className={inputClass} placeholder="e.g. Dell, Samsung" />
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input type="text" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} className={inputClass} placeholder="e.g. XPS 15 9530" />
              </div>
              <div>
                <label className={labelClass}>Price (£) *</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inputClass} required placeholder="0.00" />
              </div>
              <div>
                <label className={labelClass}>Stock</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className={inputClass} placeholder="0" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="available" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} className="accent-blue-600" />
                <label htmlFor="available" className="text-sm text-slate-700 dark:text-slate-300">Available in catalogue</label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Brief product description…" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Specs (JSON or plain text)</label>
                <textarea rows={2} value={form.specs} onChange={e => setForm(p => ({ ...p, specs: e.target.value }))} className={inputClass} placeholder='e.g. {"RAM":"16GB","Storage":"512GB SSD"}' />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Product Image {editItem ? '(leave blank to keep existing)' : ''}</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100" />
                {form.imageBase64 && <p className="text-xs text-green-600 dark:text-green-400 mt-1">✅ Image selected</p>}
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-colors">
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700">
        {loading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <div className="text-4xl mb-2">🛒</div>
            <p>No products yet. Add your first product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Product ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      {item.imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${item.imageBase64}`} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-lg">📦</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{item.productId}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white max-w-[160px] truncate">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.category}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.brand || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">£{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      }`}>{item.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.available === 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>{item.available === 1 ? 'Active' : 'Hidden'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          Edit
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(item)}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCatalogue;
