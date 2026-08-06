'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, ArrowUp, ArrowDown, ArrowUpDown, X, SlidersHorizontal, Search, Tag, Boxes, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api-client';

type Product = { 
  id: string; 
  name: string; 
  sku: string; 
  sellingPrice: string; 
  currentStockQty: number; 
  unit?: string;
  categoryId: string;
  category: { id: string; name: string }; 
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting State
  const [sortField, setSortField] = useState<'name' | 'sku' | 'category' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Category Filter State
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState<string>('');
  
  // Admin Role Check
  const [isAdmin, setIsAdmin] = useState(false);

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [detailsData, setDetailsData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'inflow' | 'outflow'>('all');

  // Product Edit Form State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editUnit, setEditUnit] = useState('pcs');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editTaxRate, setEditTaxRate] = useState('');
  const [editEstimatedCostPrice, setEditEstimatedCostPrice] = useState('');
  const [showEditNewCategoryForm, setShowEditNewCategoryForm] = useState(false);
  const [editNewCategoryName, setEditNewCategoryName] = useState('');
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  
  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodUnit, setProdUnit] = useState('pcs');
  const [prodSellingPrice, setProdSellingPrice] = useState('');
  const [prodTaxRate, setProdTaxRate] = useState('');
  const [prodEstimatedCostPrice, setProdEstimatedCostPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchProfile();
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery || filterCategory || selectedFilterCategoryId || filterStockStatus || filterPriceMin || filterPriceMax
  );

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setSelectedFilterCategoryId('');
    setFilterStockStatus('');
    setFilterPriceMin('');
    setFilterPriceMax('');
  };

  const fetchProfile = async () => {
    try {
      const profile = await apiFetch('/api/auth/me');
      if (profile && profile.role === 'admin') {
        setIsAdmin(true);
        localStorage.setItem('userRole', 'admin');
      } else {
        setIsAdmin(false);
        localStorage.setItem('userRole', profile?.role || 'staff');
      }
    } catch (err) {
      const storedRole = localStorage.getItem('userRole');
      setIsAdmin(storedRole === 'admin');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiFetch('/api/inventory/products');
      setProducts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/api/inventory/categories');
      setCategories(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSort = (field: 'name' | 'sku' | 'category' | 'price' | 'stock') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: 'name' | 'sku' | 'category' | 'price' | 'stock') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1.5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1.5 text-[var(--color-brand-600)] shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1.5 text-[var(--color-brand-600)] shrink-0" />;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodUnit.trim() || prodSellingPrice === '') return;
    setIsSaving(true);

    try {
      let finalCategoryId = prodCategoryId;

      // Create new category if requested
      if (showNewCategoryForm && newCategoryName.trim()) {
        const newCat = await apiFetch('/api/inventory/categories', {
          method: 'POST',
          body: JSON.stringify({ name: newCategoryName.trim() })
        });
        if (newCat && newCat.id) {
          finalCategoryId = newCat.id;
        }
      }

      if (!finalCategoryId) {
        alert('Please select or create a category.');
        setIsSaving(false);
        return;
      }

      await apiFetch('/api/inventory/products', {
        method: 'POST',
        body: JSON.stringify({
          name: prodName.trim(),
          sku: prodSku.trim() || undefined,
          categoryId: finalCategoryId,
          unit: prodUnit.trim(),
          sellingPrice: Number(prodSellingPrice),
          taxRate: prodTaxRate === '' ? null : Number(prodTaxRate),
          estimatedCostPrice: prodEstimatedCostPrice === '' ? null : Number(prodEstimatedCostPrice)
        })
      });

      alert('Product created successfully!');
      setIsAddModalOpen(false);
      
      // Reset form
      setProdName('');
      setProdSku('');
      setProdCategoryId('');
      setProdUnit('pcs');
      setProdSellingPrice('');
      setProdTaxRate('');
      setProdEstimatedCostPrice('');
      setShowNewCategoryForm(false);
      setNewCategoryName('');

      fetchProducts();
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setSelectedProductId(id);
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    setDetailsData(null);
    setLedgerFilter('all');

    try {
      const data = await apiFetch(`/api/admin/products/${id}/details`);
      setDetailsData(data);
      if (data && data.product) {
        setEditName(data.product.name || '');
        setEditSku(data.product.sku || '');
        setEditCategoryId(data.product.categoryId || '');
        setEditUnit(data.product.unit || 'pcs');
        setEditSellingPrice(data.product.sellingPrice !== null ? data.product.sellingPrice.toString() : '');
        setEditTaxRate(data.product.taxRate !== null && data.product.taxRate !== undefined ? data.product.taxRate.toString() : '');
        setEditEstimatedCostPrice(data.product.estimatedCostPrice !== null && data.product.estimatedCostPrice !== undefined ? data.product.estimatedCostPrice.toString() : '');
        setIsEditingProduct(false);
        setShowEditNewCategoryForm(false);
        setEditNewCategoryName('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load details');
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUnit.trim() || editSellingPrice === '' || !editSku.trim()) {
      alert('Please fill in all required fields (Name, SKU, Unit, Selling Price).');
      return;
    }
    setIsUpdatingProduct(true);

    try {
      let finalCategoryId = editCategoryId;

      // Create new category if requested
      if (showEditNewCategoryForm && editNewCategoryName.trim()) {
        const newCat = await apiFetch('/api/inventory/categories', {
          method: 'POST',
          body: JSON.stringify({ name: editNewCategoryName.trim() })
        });
        if (newCat && newCat.id) {
          finalCategoryId = newCat.id;
        }
      }

      if (!finalCategoryId) {
        alert('Please select or create a category.');
        setIsUpdatingProduct(false);
        return;
      }

      await apiFetch(`/api/inventory/products/${selectedProductId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          sku: editSku.trim(),
          categoryId: finalCategoryId,
          unit: editUnit.trim(),
          sellingPrice: Number(editSellingPrice),
          taxRate: editTaxRate === '' ? null : Number(editTaxRate),
          estimatedCostPrice: editEstimatedCostPrice === '' ? null : Number(editEstimatedCostPrice)
        })
      });

      alert('Product updated successfully!');
      
      // Reload products list and current product details
      fetchProducts();
      fetchCategories();
      
      // Refresh details data
      const data = await apiFetch(`/api/admin/products/${selectedProductId}/details`);
      setDetailsData(data);
      setIsEditingProduct(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Filter products by category, search query, stock status, and price range
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }

    const targetCategory = filterCategory || selectedFilterCategoryId;
    if (targetCategory) {
      result = result.filter(p => p.categoryId === targetCategory);
    }

    if (filterStockStatus) {
      if (filterStockStatus === 'in_stock') result = result.filter(p => p.currentStockQty > 0);
      else if (filterStockStatus === 'low_stock') result = result.filter(p => p.currentStockQty > 0 && p.currentStockQty <= 5);
      else if (filterStockStatus === 'out_of_stock') result = result.filter(p => p.currentStockQty <= 0);
    }

    if (filterPriceMin) {
      const min = Number(filterPriceMin);
      if (!isNaN(min)) result = result.filter(p => Number(p.sellingPrice) >= min);
    }

    if (filterPriceMax) {
      const max = Number(filterPriceMax);
      if (!isNaN(max)) result = result.filter(p => Number(p.sellingPrice) <= max);
    }

    return result;
  }, [products, searchQuery, filterCategory, selectedFilterCategoryId, filterStockStatus, filterPriceMin, filterPriceMax]);

  // Sort logic
  const sortedProducts = useMemo(() => {
    let result = [...filteredProducts];
    result.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';
      if (sortField === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortField === 'sku') {
        aVal = a.sku || '';
        bVal = b.sku || '';
      } else if (sortField === 'category') {
        aVal = a.category?.name || '';
        bVal = b.category?.name || '';
      } else if (sortField === 'price') {
        aVal = Number(a.sellingPrice) || 0;
        bVal = Number(b.sellingPrice) || 0;
      } else if (sortField === 'stock') {
        aVal = a.currentStockQty;
        bVal = b.currentStockQty;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    return result;
  }, [filteredProducts, sortField, sortOrder]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-brand-50)] text-[var(--color-brand-600)] rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-app-text)] flex items-center gap-2">
              Products Catalog
              {isAdmin && (
                <span className="px-2 py-0.5 bg-[var(--color-brand-100)] text-[var(--color-brand-700)] rounded text-[10px] font-bold">
                  Admin View
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-app-muted)]">
              {loading ? 'Loading...' : `${sortedProducts.length} product${sortedProducts.length !== 1 ? 's' : ''}`}
              {hasActiveFilters && products.length !== sortedProducts.length ? ` of ${products.length} total` : ''}
              {isAdmin && <span className="ml-2 text-xs text-[var(--color-brand-600)] font-medium hidden sm:inline">• Click any product to view details & ledger</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 text-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[var(--color-brand-500)] text-white rounded-full leading-none">
                !
              </span>
            )}
          </Button>

          <Button size="sm" className="gap-2 text-xs cursor-pointer font-bold" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-app-border)]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-muted)] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand-600)]" />
                    Product Filters
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear All Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-gray-400" /> Search Name / SKU
                    </label>
                    <Input
                      type="text"
                      placeholder="Type name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400" /> Category
                    </label>
                    <select
                      value={filterCategory || selectedFilterCategoryId}
                      onChange={(e) => {
                        setFilterCategory(e.target.value);
                        setSelectedFilterCategoryId(e.target.value);
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-xs font-medium text-[var(--color-app-text)] focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-gray-400" /> Stock Status
                    </label>
                    <select
                      value={filterStockStatus}
                      onChange={(e) => setFilterStockStatus(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-xs font-medium text-[var(--color-app-text)] focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer"
                    >
                      <option value="">All Stock Levels</option>
                      <option value="in_stock">In Stock (&gt; 0)</option>
                      <option value="low_stock">Low Stock (1 - 5)</option>
                      <option value="out_of_stock">Out of Stock (0)</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Price Range (₹)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filterPriceMin}
                        onChange={(e) => setFilterPriceMin(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filterPriceMax}
                        onChange={(e) => setFilterPriceMax(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center gap-3 text-[var(--color-app-muted)]">
                <div className="w-5 h-5 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                Loading products...
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--color-app-muted)]">
              <Package className="w-12 h-12 mb-4 opacity-20" />
              {hasActiveFilters ? (
                <>
                  <p className="font-medium text-sm text-[var(--color-app-text)]">No products match your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-xs font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </>
              ) : (
                <p>No products found in catalog.</p>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE: Card list (< md) */}
              <div className="md:hidden divide-y divide-[var(--color-app-border)]">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => isAdmin && handleOpenDetails(product.id)}
                    className={`p-4 hover:bg-[var(--color-brand-50)]/40 active:bg-[var(--color-brand-50)] transition-colors ${
                      isAdmin ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[var(--color-app-text)] truncate">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                          {product.sku && (
                            <span className="text-[11px] font-mono text-[var(--color-app-muted)]">
                              SKU: {product.sku}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.currentStockQty > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {product.currentStockQty > 0 ? `${product.currentStockQty} ${product.unit || 'pcs'}` : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-app-border)] text-xs">
                      <div>
                        <span className="text-[var(--color-app-muted)] text-[10px] uppercase font-semibold block">Selling Price</span>
                        <span className="font-bold text-sm text-[var(--color-app-text)] font-mono">
                          ₹{Number(product.sellingPrice).toFixed(2)}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 text-xs text-[var(--color-brand-600)] font-medium">
                          Details <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP: Full table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[500px]">
                  <thead className="text-xs text-[var(--color-app-muted)] uppercase bg-gray-50 border-b border-[var(--color-app-border)] select-none">
                    <tr>
                      <th onClick={() => handleSort('name')} className="px-4 md:px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 group transition-colors">
                        <div className="flex items-center">
                          Product Name
                          {renderSortIcon('name')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('sku')} className="px-4 md:px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 group transition-colors hidden sm:table-cell">
                        <div className="flex items-center">
                          SKU
                          {renderSortIcon('sku')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('category')} className="px-4 md:px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 group transition-colors hidden md:table-cell">
                        <div className="flex items-center">
                          Category
                          {renderSortIcon('category')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('price')} className="px-4 md:px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 group transition-colors">
                        <div className="flex items-center">
                          Price
                          {renderSortIcon('price')}
                        </div>
                      </th>
                      <th onClick={() => handleSort('stock')} className="px-4 md:px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 group transition-colors">
                        <div className="flex items-center">
                          Stock
                          {renderSortIcon('stock')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-app-border)]">
                    {sortedProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        onClick={() => isAdmin && handleOpenDetails(product.id)}
                        className={`hover:bg-gray-50/50 transition-colors ${isAdmin ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-4 md:px-6 py-4 font-medium text-[var(--color-app-text)]">
                          <div>
                            {product.name}
                            {isAdmin && (
                              <span className="text-[10px] text-[var(--color-brand-600)] font-semibold ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                View details &rarr;
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[var(--color-app-muted)] hidden sm:table-cell">{product.sku}</td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 font-medium">₹{Number(product.sellingPrice).toFixed(2)}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${product.currentStockQty > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {product.currentStockQty}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-2xl sm:rounded-xl border-0 sm:border border-[var(--color-app-border)] shadow-2xl w-full sm:max-w-[500px] max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--color-app-border)] flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-[var(--color-app-text)]">Add New Product</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddProduct} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Product Name */}
                <div className="space-y-1">
                  <Label htmlFor="prodName" className="text-xs font-semibold">Product Name *</Label>
                  <Input
                    id="prodName"
                    placeholder="Enter product name"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <Label htmlFor="prodSku" className="text-xs font-semibold">SKU / Barcode *</Label>
                  <Input
                    id="prodSku"
                    placeholder="e.g. MBP-M3-14 or ANKER-737"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Category Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">Category *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryForm(!showNewCategoryForm);
                        setProdCategoryId('');
                      }}
                      className="text-xs text-[var(--color-brand-600)] hover:underline font-medium"
                    >
                      {showNewCategoryForm ? 'Select Existing' : 'Create New Category'}
                    </button>
                  </div>

                  {!showNewCategoryForm ? (
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(e.target.value)}
                      required={!showNewCategoryForm}
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 border border-[var(--color-app-border)] rounded-lg bg-gray-50/50">
                      <div className="space-y-1">
                        <Label htmlFor="newCatName" className="text-xs">Category Name *</Label>
                        <Input
                          id="newCatName"
                          placeholder="e.g. Peripherals"
                          required={showNewCategoryForm}
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Unit & Selling Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="prodUnit" className="text-xs font-semibold">Unit *</Label>
                    <select
                      id="prodUnit"
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="box">box</option>
                      <option value="liters">liters</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prodSellingPrice" className="text-xs font-semibold">Selling Price ($) *</Label>
                    <Input
                      id="prodSellingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                      value={prodSellingPrice}
                      onChange={(e) => setProdSellingPrice(e.target.value)}
                      className="h-10 text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Optional Fields: Tax & Est Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="prodTaxRate" className="text-xs font-semibold">Tax Rate (%)</Label>
                    <Input
                      id="prodTaxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 18.00"
                      value={prodTaxRate}
                      onChange={(e) => setProdTaxRate(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prodEstimatedCostPrice" className="text-xs font-semibold">Estimated Cost ($)</Label>
                    <Input
                      id="prodEstimatedCostPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={prodEstimatedCostPrice}
                      onChange={(e) => setProdEstimatedCostPrice(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[var(--color-app-border)] bg-gray-50/50 flex gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Details Modal (Admin Only) */}
      {isAdmin && isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-2xl sm:rounded-xl border-0 sm:border border-[var(--color-app-border)] shadow-2xl w-full sm:max-w-[600px] max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--color-app-border)] flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-app-text)]">
                  {loadingDetails ? 'Loading...' : detailsData?.product.name}
                </h2>
                {!loadingDetails && detailsData && (
                  <p className="text-xs text-[var(--color-app-muted)] mt-1">
                    SKU: {detailsData.product.sku} | Category: {detailsData.product.category?.name || 'Uncategorized'}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetails ? (
                <div className="p-12 text-center text-[var(--color-app-muted)]">Loading details...</div>
              ) : !detailsData ? (
                <div className="p-12 text-center text-red-500">Failed to load product details.</div>
              ) : isEditingProduct ? (
                <form onSubmit={handleUpdateProduct} id="edit-product-form" className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <Label htmlFor="editName" className="text-xs font-semibold">Product Name *</Label>
                    <Input
                      id="editName"
                      placeholder="Enter product name"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-1">
                    <Label htmlFor="editSku" className="text-xs font-semibold">SKU / Barcode *</Label>
                    <Input
                      id="editSku"
                      placeholder="e.g. MBP-M3-14 or ANKER-737"
                      required
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* Category Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold">Category *</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditNewCategoryForm(!showEditNewCategoryForm);
                          setEditCategoryId('');
                        }}
                        className="text-xs text-[var(--color-brand-600)] hover:underline font-medium"
                      >
                        {showEditNewCategoryForm ? 'Select Existing' : 'Create New Category'}
                      </button>
                    </div>

                    {!showEditNewCategoryForm ? (
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        required={!showEditNewCategoryForm}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 border border-[var(--color-app-border)] rounded-lg bg-gray-50/50">
                        <div className="space-y-1">
                          <Label htmlFor="newEditCatName" className="text-xs font-medium text-[var(--color-app-text)]">Category Name *</Label>
                          <Input
                            id="newEditCatName"
                            placeholder="e.g. Peripherals"
                            required={showEditNewCategoryForm}
                            value={editNewCategoryName}
                            onChange={(e) => setEditNewCategoryName(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Unit & Selling Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="editUnit" className="text-xs font-semibold">Unit *</Label>
                      <select
                        id="editUnit"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none"
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="box">box</option>
                        <option value="liters">liters</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editSellingPrice" className="text-xs font-semibold">Selling Price ($) *</Label>
                      <Input
                        id="editSellingPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                        value={editSellingPrice}
                        onChange={(e) => setEditSellingPrice(e.target.value)}
                        className="h-10 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Tax & Est Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="editTaxRate" className="text-xs font-semibold">Tax Rate (%)</Label>
                      <Input
                        id="editTaxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 18.00"
                        value={editTaxRate}
                        onChange={(e) => setEditTaxRate(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editEstimatedCostPrice" className="text-xs font-semibold">Estimated Cost ($)</Label>
                      <Input
                        id="editEstimatedCostPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={editEstimatedCostPrice}
                        onChange={(e) => setEditEstimatedCostPrice(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border border-[var(--color-app-border)] rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-[var(--color-app-muted)]">Current Stock</p>
                      <p className="text-2xl font-bold text-[var(--color-app-text)] mt-1">
                        {detailsData.product.currentStockQty} <span className="text-xs font-normal text-gray-500">{detailsData.product.unit}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-[var(--color-app-border)] rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-[var(--color-app-muted)]">Total Sales</p>
                      <p className="text-2xl font-bold text-[var(--color-brand-600)] mt-1">
                        ${detailsData.metrics.totalSales.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-emerald-800">Total Profit</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        ${detailsData.metrics.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Profit Graph Trend */}
                  <div className="bg-gray-50 border border-[var(--color-app-border)] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-app-text)] mb-4">Sales & Profit Trend (Last 7 Days)</h3>
                    <div className="h-44 flex items-end gap-3 px-2 pt-2 relative border-b border-l border-gray-200">
                      {detailsData.salesGraphData.map((data: any, idx: number) => {
                        const maxVal = Math.max(...detailsData.salesGraphData.map((d: any) => Math.max(d.sales, d.profit, 1)));
                        const salesHeightPercent = (data.sales / maxVal) * 100;
                        const profitHeightPercent = (data.profit / maxVal) * 100;
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 text-center whitespace-nowrap shadow-md">
                              <div>Sales: ${data.sales.toFixed(2)}</div>
                              <div className="text-emerald-400 font-medium">Profit: ${data.profit.toFixed(2)}</div>
                              <div className="text-gray-400 text-[8px] mt-0.5">{data.date}</div>
                            </div>

                            <div className="w-full flex justify-center gap-1 items-end h-[85%]">
                              {/* Sales Bar */}
                              <div 
                                style={{ height: `${salesHeightPercent}%` }} 
                                className="w-2.5 bg-[var(--color-brand-500)] rounded-t transition-all duration-500 hover:bg-[var(--color-brand-600)]"
                              />
                              {/* Profit Bar */}
                              <div 
                                style={{ height: `${profitHeightPercent}%` }} 
                                className="w-2.5 bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600"
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 mt-2 whitespace-nowrap select-none">{data.date}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 justify-center items-center mt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-[var(--color-brand-500)] rounded" />
                        <span className="text-gray-600 font-medium">Sales</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                        <span className="text-gray-600 font-medium">Profit</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Ledger Table */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-[var(--color-app-text)]">Ledger (Inflow & Outflow)</h3>
                      <div className="flex bg-gray-100 p-0.5 rounded-lg border border-[var(--color-app-border)]">
                        {(['all', 'inflow', 'outflow'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setLedgerFilter(filter)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${ledgerFilter === filter ? 'bg-white text-[var(--color-app-text)] shadow-sm' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]'}`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border border-[var(--color-app-border)] rounded-xl overflow-hidden bg-white max-h-[220px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 border-b border-[var(--color-app-border)] uppercase text-[10px] text-[var(--color-app-muted)] sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Date</th>
                            <th className="px-4 py-2.5 font-medium">Type</th>
                            <th className="px-4 py-2.5 font-medium">Qty</th>
                            <th className="px-4 py-2.5 font-medium">Rate</th>
                            <th className="px-4 py-2.5 font-medium">By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-app-border)]">
                          {(detailsData.transactions || []).filter((t: any) => {
                            if (ledgerFilter === 'inflow') return t.type === 'stock_in' || t.quantityDelta > 0;
                            if (ledgerFilter === 'outflow') return t.type === 'sale' || t.quantityDelta < 0;
                            return true;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                No matching transactions found.
                              </td>
                            </tr>
                          ) : (
                            (detailsData.transactions || []).filter((t: any) => {
                              if (ledgerFilter === 'inflow') return t.type === 'stock_in' || t.quantityDelta > 0;
                              if (ledgerFilter === 'outflow') return t.type === 'sale' || t.quantityDelta < 0;
                              return true;
                            }).map((t: any) => {
                              const isPositive = t.quantityDelta > 0;
                              return (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-2.5 text-gray-500">
                                    {new Date(t.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                                      t.type === 'stock_in' 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : t.type === 'sale' 
                                          ? 'bg-purple-50 text-purple-600' 
                                          : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {t.type}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-2.5 font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isPositive ? `+${t.quantityDelta}` : t.quantityDelta}
                                  </td>
                                  <td className="px-4 py-2.5 font-medium">${Number(t.rate).toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{t.username}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--color-app-border)] bg-gray-50/50 flex gap-3 shrink-0">
              {loadingDetails ? (
                <Button key="btn-loading" type="button" className="w-full" disabled>Loading...</Button>
              ) : isEditingProduct ? (
                <>
                  <Button
                    key="btn-cancel"
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditingProduct(false)}
                    disabled={isUpdatingProduct}
                  >
                    Cancel
                  </Button>
                  <Button
                    key="btn-save"
                    type="submit"
                    form="edit-product-form"
                    className="flex-1"
                    disabled={isUpdatingProduct}
                  >
                    {isUpdatingProduct ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    key="btn-close"
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDetailsModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    key="btn-edit"
                    type="button"
                    className="flex-1"
                    onClick={() => setIsEditingProduct(true)}
                  >
                    Edit Product
                  </Button>
                </>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
