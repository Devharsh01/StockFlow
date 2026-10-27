'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Plus, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { generateHardwareSku } from '@/lib/sku-generator';
import { apiFetch } from '@/lib/api-client';

export type ProductInitialData = {
  name?: string;
  sku?: string;
  categoryId?: string;
  unit?: string;
  sellingPrice?: string | number;
  estimatedCostPrice?: string | number;
  costPrice?: string | number;
  taxRate?: string | number;
};

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
  initialData?: ProductInitialData;
  title?: string;
  subtitle?: string;
  context?: 'inbound' | 'outbound' | 'general';
}

export function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  title = 'Create New Product',
  subtitle = 'Fill in product details to add directly to catalog',
  context = 'general',
}: CreateProductModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [sellingPrice, setSellingPrice] = useState('');
  const [estimatedCostPrice, setEstimatedCostPrice] = useState('');
  const [taxRate, setTaxRate] = useState('');

  // Inline Category Creation
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Saving / Error State
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setSku(initialData?.sku || (initialData?.name ? generateHardwareSku(initialData.name) : ''));
      setCategoryId(initialData?.categoryId || '');
      setUnit(initialData?.unit || 'pcs');
      setSellingPrice(
        initialData?.sellingPrice !== undefined && initialData?.sellingPrice !== null
          ? initialData.sellingPrice.toString()
          : ''
      );
      const initCost = initialData?.estimatedCostPrice !== undefined && initialData?.estimatedCostPrice !== null
        ? initialData.estimatedCostPrice.toString()
        : initialData?.costPrice !== undefined && initialData?.costPrice !== null
        ? initialData.costPrice.toString()
        : '';
      setEstimatedCostPrice(initCost);
      setTaxRate(
        initialData?.taxRate !== undefined && initialData?.taxRate !== null
          ? initialData.taxRate.toString()
          : ''
      );
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setError(null);
      fetchCategories();
    }
  }, [isOpen, initialData]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await apiFetch('/api/inventory/categories');
      setCategories(data || []);
      if (data && data.length > 0 && !categoryId && !initialData?.categoryId) {
        setCategoryId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAutoGenerateSku = () => {
    if (name.trim()) {
      setSku(generateHardwareSku(name));
    } else {
      setSku('ITEM');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('SKU / Barcode is required.');
      return;
    }
    if (sellingPrice === '' || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      setError('A valid Selling Price is required.');
      return;
    }

    setIsSaving(true);

    try {
      let finalCategoryId = categoryId;

      // If user is adding a new category inline
      if (showNewCategoryForm && newCategoryName.trim()) {
        const newCat = await apiFetch('/api/inventory/categories', {
          method: 'POST',
          body: JSON.stringify({ name: newCategoryName.trim() }),
        });
        if (newCat && newCat.id) {
          finalCategoryId = newCat.id;
        } else {
          throw new Error('Failed to create new category.');
        }
      }

      if (!finalCategoryId) {
        setError('Please select or create a category.');
        setIsSaving(false);
        return;
      }

      const createdProduct = await apiFetch('/api/inventory/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          categoryId: finalCategoryId,
          unit: unit.trim() || 'pcs',
          sellingPrice: Number(sellingPrice),
          taxRate: taxRate === '' ? null : Number(taxRate),
          estimatedCostPrice: estimatedCostPrice === '' ? null : Number(estimatedCostPrice),
        }),
      });

      if (!createdProduct || !createdProduct.id) {
        throw new Error('Failed to create product.');
      }

      // Attach category name if available
      const catObj = categories.find((c) => c.id === finalCategoryId);
      const enrichedProduct = {
        ...createdProduct,
        category: catObj || { id: finalCategoryId, name: newCategoryName || 'General' },
      };

      onSuccess(enrichedProduct);
      onClose();
    } catch (err: any) {
      console.error('Create product error:', err);
      setError(err.message || 'Failed to create product.');
    } finally {
      setIsSaving(false);
    }
  };

  const isCostHigherThanSelling =
    estimatedCostPrice !== '' &&
    sellingPrice !== '' &&
    Number(estimatedCostPrice) > Number(sellingPrice);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSaving && onClose()}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-[var(--color-app-border)] shadow-2xl w-full sm:max-w-[540px] max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--color-app-border)] flex justify-between items-center bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-app-text)] leading-tight flex items-center gap-2">
                    {title}
                  </h2>
                  <p className="text-xs text-[var(--color-app-muted)] mt-0.5">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="p-1.5 hover:bg-gray-200/70 rounded-lg transition-colors text-[var(--color-app-muted)] hover:text-[var(--color-app-text)] disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Product Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-prod-name" className="text-xs font-semibold text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-prod-name"
                    placeholder="e.g. Asian Paints White Primer 1L"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!sku && e.target.value.trim()) {
                        setSku(generateHardwareSku(e.target.value));
                      }
                    }}
                    required
                    autoFocus
                    className="h-10 text-sm font-medium"
                  />
                </div>

                {/* SKU / Barcode */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="create-prod-sku" className="text-xs font-semibold text-gray-700">
                      SKU / Barcode <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSku}
                      className="text-[11px] text-[var(--color-brand-600)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Auto-generate
                    </button>
                  </div>
                  <Input
                    id="create-prod-sku"
                    placeholder="e.g. MOUSE-ERG-101"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    className="h-10 text-sm font-mono"
                  />
                </div>

                {/* Category Section */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                      className="text-[11px] text-[var(--color-brand-600)] hover:underline font-semibold cursor-pointer"
                    >
                      {showNewCategoryForm ? '← Select Existing' : '+ New Category'}
                    </button>
                  </div>

                  {!showNewCategoryForm ? (
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required={!showNewCategoryForm}
                      disabled={loadingCategories}
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer disabled:bg-gray-100"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 border border-[var(--color-app-border)] rounded-xl bg-gray-50/80 space-y-2">
                      <Label htmlFor="newCategoryName" className="text-xs font-semibold">
                        New Category Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="newCategoryName"
                        placeholder="e.g. Computer Accessories"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required={showNewCategoryForm}
                        className="h-9 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Unit & Selling Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="create-prod-unit" className="text-xs font-semibold text-gray-700">
                      Unit <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="create-prod-unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer"
                    >
                      <option value="pcs">pcs (Pieces)</option>
                      <option value="box">box (Boxes)</option>
                      <option value="pack">pack (Packs)</option>
                      <option value="kg">kg (Kilograms)</option>
                      <option value="g">g (Grams)</option>
                      <option value="liters">liters</option>
                      <option value="m">m (Meters)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-prod-price" className="text-xs font-semibold text-gray-700">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="create-prod-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      required
                      className="h-10 text-sm font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Cost Price (CP) & Tax Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="create-prod-cost" className="text-xs font-semibold text-gray-700">
                        Cost Price (CP) (₹)
                      </Label>
                      {context === 'inbound' && (
                        <span className="text-[10px] text-emerald-600 font-semibold">Prefilled</span>
                      )}
                    </div>
                    <Input
                      id="create-prod-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={estimatedCostPrice}
                      onChange={(e) => setEstimatedCostPrice(e.target.value)}
                      className="h-10 text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-prod-tax" className="text-xs font-semibold text-gray-700">
                      Tax Rate (%) <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="create-prod-tax"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g. 18"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Warning if cost > selling price */}
                {isCostHigherThanSelling && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Cost price exceeds selling price (Negative margin warning).</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-[var(--color-app-border)] bg-gray-50/70 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isSaving}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="cursor-pointer font-bold text-xs gap-1.5 min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
