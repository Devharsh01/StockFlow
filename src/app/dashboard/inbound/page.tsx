'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PackagePlus, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Autocomplete, Option } from '@/components/ui/Autocomplete';
import { apiFetch } from '@/lib/api-client';

type InboundRow = {
  id: string;
  productId: string;
  selectedProduct: any | null;
  quantity: string;
  costPrice: string;
};

export default function InboundPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [supplierName, setSupplierName] = useState<string>('');
  const [formKey, setFormKey] = useState(0);

  // Rows state for multi-item consignment
  const [rows, setRows] = useState<InboundRow[]>([
    { id: 'row-1', productId: '', selectedProduct: null, quantity: '1', costPrice: '' },
  ]);

  const fetchProducts = async (query: string): Promise<Option[]> => {
    try {
      const data = await apiFetch(`/api/inventory/products/search?q=${encodeURIComponent(query)}`);
      return data || [];
    } catch {
      return [];
    }
  };

  const fetchSuppliers = async (query: string): Promise<Option[]> => {
    try {
      const data = await apiFetch(`/api/inventory/suppliers/search?q=${encodeURIComponent(query)}`);
      return data || [];
    } catch {
      return [];
    }
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setRows((prev) => [
      ...prev,
      { id: newId, productId: '', selectedProduct: null, quantity: '1', costPrice: '' },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof InboundRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === 'selectedProduct') {
          return {
            ...row,
            selectedProduct: value,
            productId: value ? value.id : '',
          };
        }

        return { ...row, [field]: value };
      })
    );
  };

  // Calculations
  const totalItemsCount = rows.length;
  const totalQuantity = rows.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0);
  const totalConsignmentCost = rows.reduce((acc, row) => {
    const qty = Number(row.quantity) || 0;
    const cost = Number(row.costPrice) || 0;
    return acc + qty * cost;
  }, 0);

  // Strict Form Validation
  const isFormValid =
    rows.length > 0 &&
    rows.every((row) => {
      if (!row.productId || !row.quantity || !row.costPrice || row.costPrice.trim() === '') {
        return false;
      }
      const qty = Number(row.quantity);
      const cost = Number(row.costPrice);
      if (isNaN(qty) || qty <= 0) return false;
      if (isNaN(cost) || cost < 0) return false;
      if (row.selectedProduct && cost > Number(row.selectedProduct.sellingPrice)) {
        return false;
      }
      return true;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setMessage(null);

    const validItems = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const qty = Number(row.quantity);
      const cost = Number(row.costPrice);

      validItems.push({
        productId: row.productId,
        quantity: qty,
        costPricePerUnit: cost,
      });
    }

    try {
      await apiFetch('/api/inventory/stock-in', {
        method: 'POST',
        body: JSON.stringify({
          supplierName: supplierName || undefined,
          items: validItems,
        }),
      });

      setMessage({
        type: 'success',
        text: `Successfully recorded stock-in for ${validItems.length} product(s)!`,
      });

      setFormKey((prev) => prev + 1);
      setSupplierName('');
      setRows([{ id: 'row-1', productId: '', selectedProduct: null, quantity: '1', costPrice: '' }]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to record stock-in' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-10"
    >
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 self-start">
          <PackagePlus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
            Record Stock In
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Add stock for one or multiple products in a single entry
          </p>
        </div>
      </div>

      <form key={formKey} onSubmit={handleSubmit}>
        <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Left Aligned Supplier Entry (No "Consignment Details" heading) */}
            <div className="pb-5 border-b border-gray-100">
              <div className="w-full sm:w-80 space-y-1.5">
                <Label htmlFor="supplierName" className="text-xs font-semibold text-gray-800">
                  Supplier Name <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                <Autocomplete
                  name="supplierName"
                  placeholder="Type or search vendor name..."
                  fetchOptions={fetchSuppliers}
                  allowCustomValue={true}
                  onChange={(val) => setSupplierName(val)}
                />
              </div>
            </div>

            {/* Toast Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl flex items-center gap-3 border ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span className="text-xs font-semibold">{message.text}</span>
              </motion.div>
            )}

            {/* Item Rows Section */}
            <div className="space-y-3">
              <div className="space-y-3">
                {rows.map((row, idx) => {
                  const lineQty = Number(row.quantity) || 0;
                  const lineCost = Number(row.costPrice) || 0;
                  const lineTotal = lineQty * lineCost;

                  const isCostExcess =
                    row.selectedProduct &&
                    !isNaN(lineCost) &&
                    lineCost > Number(row.selectedProduct.sellingPrice);

                  return (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 sm:p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-2.5 shadow-2xs"
                    >
                      {/* Card Header: Item Badge + Subtotal + Remove Button */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            Item #{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <span>Subtotal:</span>
                            <span className="font-bold text-gray-900 font-mono text-xs">{formatCurrency(lineTotal)}</span>
                          </div>
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inputs: Responsive Grid */}
                      <div className="space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-start">
                        {/* Product */}
                        <div className="sm:col-span-6 space-y-1">
                          <Label className="text-xs font-semibold text-gray-700">Product *</Label>
                          <Autocomplete
                            placeholder="Search product..."
                            fetchOptions={fetchProducts}
                            allowCustomValue={false}
                            onChange={(val, opt) => handleUpdateRow(row.id, 'selectedProduct', opt)}
                          />
                        </div>

                        {/* Quantity & Cost/Unit container (side-by-side on Mobile, flattened on Desktop) */}
                        <div className="grid grid-cols-2 gap-2.5 sm:contents">
                          {/* Quantity */}
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-xs font-semibold text-gray-700">Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => handleUpdateRow(row.id, 'quantity', e.target.value)}
                              required
                              className="text-xs font-bold font-mono"
                            />
                          </div>

                          {/* Cost Price */}
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-xs font-semibold text-gray-700">Cost / Unit (₹) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={row.costPrice}
                              onChange={(e) => handleUpdateRow(row.id, 'costPrice', e.target.value)}
                              required
                              className="text-xs font-bold font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cost excess warning */}
                      {isCostExcess && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Cost ({formatCurrency(lineCost)}) exceeds selling price of{' '}
                            {formatCurrency(Number(row.selectedProduct.sellingPrice))}.
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Single "Add Another Product" Button at the bottom only */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-gray-200 shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Add Another Product
                </button>
              </div>
            </div>

            {/* Footer Summary & Record Button (Strictly active only when all rows are valid) */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/70 -mx-6 -mb-6 p-4 px-6 rounded-b-2xl">
              <div className="flex items-center gap-5 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Items</span>
                  <span className="font-bold font-mono text-gray-900 text-sm">{totalItemsCount}</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Units</span>
                  <span className="font-bold font-mono text-gray-900 text-sm">{totalQuantity}</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Value</span>
                  <span className="font-bold font-mono text-emerald-700 text-sm">
                    {formatCurrency(totalConsignmentCost)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full sm:w-auto px-6 py-2.5 font-bold text-xs rounded-xl transition-all shadow-sm ${
                  !isFormValid || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                }`}
              >
                {loading
                  ? 'Recording Stock...'
                  : `Record Stock In (${totalItemsCount} ${totalItemsCount === 1 ? 'Item' : 'Items'})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  );
}
