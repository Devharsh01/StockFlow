'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, Minus, Trash2, LayoutGrid, List, X, ChevronUp, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { CreateProductModal, ProductInitialData } from '@/components/products/CreateProductModal';
import { apiFetch } from '@/lib/api-client';

type Product = { id: string, name: string, sku: string, sellingPrice: number, currentStockQty: number };
type CartItem = Product & { cartQty: number };

export default function OutboundPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Create Product Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialData, setCreateInitialData] = useState<ProductInitialData | undefined>(undefined);

  // Customer & Payment States
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [finalAmountInput, setFinalAmountInput] = useState<string>('');
  const [taxInput, setTaxInput] = useState<string>('0');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);

  const handleOpenCreateProduct = (searchQuery?: string) => {
    setCreateInitialData({
      name: searchQuery || search.trim() || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleProductCreated = (newProduct: any) => {
    const formattedProd: Product = {
      id: newProduct.id,
      name: newProduct.name,
      sku: newProduct.sku,
      sellingPrice: Number(newProduct.sellingPrice),
      currentStockQty: newProduct.currentStockQty || 0,
    };

    setProducts((prev) => {
      const exists = prev.some((p) => p.id === formattedProd.id);
      if (exists) return prev;
      return [...prev, formattedProd].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Automatically add to active cart
    addToCart(formattedProd);

    // Refresh products catalog in background
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiFetch('/api/inventory/products');
      const sorted = (data || []).sort((a: Product, b: Product) => a.name.localeCompare(b.name));
      setProducts(sorted);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiFetch('/api/sales/customers');
      setCustomers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaxChange = (val: string) => {
    setTaxInput(val);
    const newTax = Number(val) || 0;
    setFinalAmountInput((subtotal + newTax).toString());
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.reduce<CartItem[]>((acc, item) => {
        if (item.id === id) {
          const newQty = item.cartQty + delta;
          if (newQty > 0) {
            acc.push({ ...item, cartQty: newQty });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, []);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCartQtyChange = (id: string, value: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, cartQty: value };
      }
      return item;
    }));
  };

  const handleCartQtyBlur = (id: string, value: number) => {
    if (value <= 0) {
      removeFromCart(id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.cartQty), 0);
  const tax = Number(taxInput) || 0;
  const total = finalAmountInput === '' ? Math.max(0, subtotal + tax) : Math.max(0, Number(finalAmountInput));
  const discount = Math.max(0, subtotal + tax - total);

  const isFinalAmountInvalid = Number(finalAmountInput) > (subtotal + tax);
  const isAmountPaidInvalid = isPartialPayment && (Number(amountPaidInput) > total);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      let finalCustomerId = selectedCustomerId || undefined;

      if (showNewCustomerForm && newCustomerName.trim()) {
        const newCust = await apiFetch('/api/sales/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || undefined,
          })
        });
        if (newCust && newCust.id) {
          finalCustomerId = newCust.id;
        }
      }

      const finalDiscount = discount;
      const finalTax = tax;
      const finalTotal = total;
      const finalAmountPaid = isPartialPayment ? (amountPaidInput === '' ? finalTotal : Number(amountPaidInput)) : finalTotal;

      await apiFetch('/api/sales/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({ productId: item.id, quantity: item.cartQty, sellingPrice: item.sellingPrice })),
          customerId: finalCustomerId,
          discountAmount: finalDiscount,
          discountType: 'flat',
          taxApplied: finalTax > 0,
          taxAmount: finalTax,
          amountPaid: finalAmountPaid,
          paymentMethod: paymentMethod
        })
      });
      
      alert('Checkout successful!');
      setCart([]);
      setIsCheckoutModalOpen(false);
      setShowMobileCart(false);
      
      setSelectedCustomerId('');
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setFinalAmountInput('');
      setTaxInput('0');
      setIsPartialPayment(false);
      
      fetchProducts();
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const CartItemsList = () => (
    <>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-[var(--color-app-muted)] py-12">
          <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
          <p>Cart is empty</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--color-app-border)]">
          {cart.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--color-app-text)] truncate">{item.name}</div>
                <div className="text-sm text-[var(--color-app-muted)]">₹{Number(item.sellingPrice).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-gray-50 rounded-lg border border-[var(--color-app-border)] px-1">
                  <button 
                    onClick={() => updateCartQty(item.id, -1)} 
                    className="p-1 hover:text-[var(--color-brand-600)] transition-colors shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input 
                    type="number"
                    min="0"
                    value={item.cartQty === 0 ? '' : item.cartQty}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleCartQtyChange(item.id, val);
                    }}
                    onBlur={() => handleCartQtyBlur(item.id, item.cartQty)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.currentTarget.blur(); return; }
                      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
                      if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    className="w-10 text-center font-medium text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button 
                    onClick={() => updateCartQty(item.id, 1)} 
                    className="p-1 hover:text-[var(--color-brand-600)] transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const CartFooter = ({ onCheckout }: { onCheckout: () => void }) => (
    <div className="p-4 md:p-6 border-t border-[var(--color-app-border)] bg-gray-50/50 space-y-3 md:space-y-4 shrink-0">
      <div className="space-y-2 text-sm text-[var(--color-app-muted)]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-[var(--color-app-border)]">
        <span className="text-base md:text-lg font-semibold text-[var(--color-app-text)]">Total</span>
        <span className="text-xl md:text-2xl font-bold text-[var(--color-brand-600)]">₹{total.toFixed(2)}</span>
      </div>

      <Button 
        size="lg" 
        className="w-full h-12 md:h-14 text-base md:text-lg" 
        disabled={cart.length === 0}
        onClick={onCheckout}
      >
        Checkout
        {cart.length > 0 && <span className="ml-2 text-sm opacity-80">({cart.reduce((s, i) => s + i.cartQty, 0)} items)</span>}
      </Button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 md:gap-6 relative"
    >
      {/* LEFT: Product Selection */}
      <div className="flex-1 flex flex-col space-y-3 md:space-y-4 min-h-0 md:h-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-brand-50)] text-[var(--color-brand-600)] rounded-lg">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
              Point of Sale
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => handleOpenCreateProduct(search.trim())}
              className="gap-1.5 text-xs font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Button>

            <div className="flex bg-gray-100 rounded-lg p-1 border border-[var(--color-app-border)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--color-brand-600)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--color-brand-600)]' : 'text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-app-muted)] w-5 h-5" />
          <Input 
            className="pl-10 h-11 md:h-12 text-base md:text-lg" 
            placeholder="Search products or scan barcode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 bg-white rounded-xl border border-[var(--color-app-border)] shadow-sm p-3 md:p-4 overflow-y-auto min-h-0 pb-24 md:pb-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredProducts.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  className="border border-[var(--color-app-border)] rounded-lg p-3 md:p-4 hover:border-[var(--color-brand-500)] cursor-pointer transition-colors group flex flex-col justify-between active:scale-95"
                >
                  <div>
                    <div className="text-[10px] text-[var(--color-app-muted)] mb-1 truncate">{p.sku}</div>
                    <div className="font-semibold text-[var(--color-app-text)] mb-2 group-hover:text-[var(--color-brand-600)] transition-colors text-xs md:text-sm line-clamp-2">{p.name}</div>
                  </div>
                  <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                    <span className="font-bold text-sm md:text-base">₹{Number(p.sellingPrice).toFixed(2)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${p.currentStockQty > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {p.currentStockQty} stk
                    </span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <Package className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {search.trim() ? `No product found for "${search.trim()}"` : 'No products in catalog.'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4 max-w-xs">
                    Create this product now and it will be added to your current order automatically.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleOpenCreateProduct(search.trim())}
                    className="text-xs font-bold gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    {search.trim() ? `Create "${search.trim()}" Product` : 'Create New Product'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProducts.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  className="border border-[var(--color-app-border)] rounded-lg p-3 hover:border-[var(--color-brand-500)] cursor-pointer transition-colors group flex items-center justify-between bg-white active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-xs font-semibold font-mono text-[var(--color-app-muted)] w-20 shrink-0 truncate hidden sm:block">{p.sku}</div>
                    <div className="font-semibold text-[var(--color-app-text)] group-hover:text-[var(--color-brand-600)] transition-colors truncate text-xs md:text-sm">{p.name}</div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-6 shrink-0">
                    <span className="font-bold text-sm md:text-base">₹{Number(p.sellingPrice).toFixed(2)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium min-w-[60px] text-center hidden sm:block ${p.currentStockQty > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {p.currentStockQty} stk
                    </span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Package className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {search.trim() ? `No product found for "${search.trim()}"` : 'No products in catalog.'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4 max-w-xs">
                    Create this product now and it will be added to your current order automatically.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleOpenCreateProduct(search.trim())}
                    className="text-xs font-bold gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    {search.trim() ? `Create "${search.trim()}" Product` : 'Create New Product'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart — desktop sidebar */}
      <Card className="hidden md:flex w-full md:w-[380px] lg:w-[400px] flex-col shadow-[var(--shadow-premium)] h-full shrink-0">
        <CardHeader className="border-b border-[var(--color-app-border)] pb-4 shrink-0">
          <CardTitle>Current Order</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <CartItemsList />
        </CardContent>
        <CartFooter onCheckout={() => {
          setFinalAmountInput(subtotal.toString());
          setTaxInput('0');
          setAmountPaidInput(subtotal.toString());
          setIsPartialPayment(false);
          setShowUpiQr(false);
          setIsCheckoutModalOpen(true);
        }} />
      </Card>

      {/* MOBILE: Sticky cart bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--color-app-border)] shadow-lg px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-[var(--color-brand-600)]" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--color-brand-600)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.reduce((s, i) => s + i.cartQty, 0)}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs text-[var(--color-app-muted)]">{cart.length} item{cart.length !== 1 ? 's' : ''}</div>
            <div className="font-bold text-[var(--color-brand-600)]">₹{total.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={() => setShowMobileCart(true)}
              className="px-3 py-2 rounded-lg border border-[var(--color-app-border)] text-sm font-medium text-[var(--color-app-text)] hover:bg-gray-50 flex items-center gap-1.5"
            >
              <ChevronUp className="w-4 h-4" />
              View Cart
            </button>
          )}
          <Button 
            disabled={cart.length === 0}
            onClick={() => {
              setFinalAmountInput(subtotal.toString());
              setTaxInput('0');
              setAmountPaidInput(subtotal.toString());
              setIsPartialPayment(false);
              setShowUpiQr(false);
              setIsCheckoutModalOpen(true);
            }}
            className="h-10 px-4 text-sm"
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* MOBILE: Full-screen cart sheet */}
      <AnimatePresence>
        {showMobileCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMobileCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="p-4 border-b border-[var(--color-app-border)] flex items-center justify-between shrink-0">
                <h2 className="font-bold text-[var(--color-app-text)]">Current Order</h2>
                <button onClick={() => setShowMobileCart(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-[var(--color-app-muted)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CartItemsList />
              </div>
              <CartFooter onCheckout={() => {
                setShowMobileCart(false);
                setFinalAmountInput(subtotal.toString());
                setTaxInput('0');
                setAmountPaidInput(subtotal.toString());
                setIsPartialPayment(false);
                setShowUpiQr(false);
                setIsCheckoutModalOpen(true);
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-t-2xl sm:rounded-xl border-0 sm:border border-[var(--color-app-border)] shadow-2xl w-full sm:max-w-[500px] max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-[var(--color-app-border)] flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-[var(--color-app-text)]">Complete Checkout</h2>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-[var(--color-app-muted)] hover:text-[var(--color-app-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-5 md:space-y-6 flex-1">
              {paymentMethod === 'upi' && showUpiQr ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-5">
                  <div className="text-center space-y-1">
                    <p className="text-base font-bold text-[var(--color-app-text)]">Scan to Pay via UPI</p>
                    <p className="text-sm font-semibold text-[var(--color-brand-600)]">Amount Due: ₹{total.toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center justify-center w-52 h-52">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-[var(--color-app-text)]">
                      <rect x="0" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="6" y="6" width="18" height="18" fill="currentColor" />
                      <rect x="70" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="76" y="6" width="18" height="18" fill="currentColor" />
                      <rect x="0" y="70" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="6" y="76" width="18" height="18" fill="currentColor" />
                      <path d="M 40,10 H 45 V 15 H 40 Z M 50,5 H 55 V 15 H 50 Z M 60,10 H 65 V 15 H 60 Z" fill="currentColor" />
                      <path d="M 40,25 H 45 V 30 H 40 Z M 50,20 H 55 V 25 H 50 Z M 60,25 H 65 V 30 H 60 Z" fill="currentColor" />
                      <path d="M 10,40 H 15 V 45 H 10 Z M 20,45 H 25 V 50 H 20 Z M 30,40 H 35 V 45 H 30 Z" fill="currentColor" />
                      <path d="M 75,40 H 80 V 45 H 75 Z M 85,45 H 90 V 50 H 85 Z M 95,40 H 100 V 45 H 95 Z" fill="currentColor" />
                      <path d="M 45,45 H 55 V 55 H 45 Z M 55,55 H 65 V 65 H 55 Z M 35,55 H 45 V 65 H 35 Z" fill="currentColor" />
                      <path d="M 40,75 H 45 V 80 H 40 Z M 50,70 H 55 V 75 H 50 Z M 60,75 H 65 V 80 H 60 Z" fill="currentColor" />
                      <path d="M 70,85 H 75 V 90 H 70 Z M 80,80 H 85 V 85 H 80 Z M 90,85 H 95 V 90 H 90 Z" fill="currentColor" />
                    </svg>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <p className="text-xs font-mono text-[var(--color-app-muted)]">UPI ID: merchant@upi</p>
                    {isPartialPayment && (
                      <p className="text-xs font-medium text-[var(--color-status-danger)]">
                        Partial payment of ₹{Number(amountPaidInput).toFixed(2)} recorded
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Customer Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-[var(--color-app-text)]">Customer Info</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCustomerForm(!showNewCustomerForm);
                          setSelectedCustomerId('');
                        }}
                        className="text-xs text-[var(--color-brand-600)] hover:underline font-medium"
                      >
                        {showNewCustomerForm ? 'Select Existing' : 'Add New Customer'}
                      </button>
                    </div>

                    {!showNewCustomerForm ? (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-sm focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none"
                      >
                        <option value="">Walk-in / Guest Customer</option>
                        {customers.map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.name} {cust.phone ? `(${cust.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 border border-[var(--color-app-border)] rounded-lg bg-gray-50/50 space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="custName" className="text-xs">Customer Name *</Label>
                          <Input id="custName" placeholder="John Doe" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="custPhone" className="text-xs">Phone Number</Label>
                          <Input id="custPhone" placeholder="123-456-7890" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="h-9 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Amount and Tax */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="finalAmount" className="text-xs font-semibold">Final Amount (₹)</Label>
                      <Input
                        id="finalAmount"
                        type="number"
                        min="0"
                        placeholder={(subtotal + tax).toFixed(2)}
                        value={finalAmountInput}
                        onChange={(e) => setFinalAmountInput(e.target.value)}
                        className={`h-9 text-sm font-semibold ${isFinalAmountInvalid ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {isFinalAmountInvalid && (
                        <div className="text-xs text-red-500 font-medium">Cannot exceed ₹{(subtotal + tax).toFixed(2)}</div>
                      )}
                      {discount > 0 && !isFinalAmountInvalid && (
                        <div className="text-xs text-emerald-600 font-medium">
                          ₹{(subtotal + tax).toFixed(2)} - ₹{discount.toFixed(2)} = ₹{total.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tax" className="text-xs font-semibold">Tax Amount (₹)</Label>
                      <Input id="tax" type="number" min="0" placeholder="0.00" value={taxInput} onChange={(e) => handleTaxChange(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3 md:space-y-4">
                    <Label className="text-sm font-semibold text-[var(--color-app-text)]">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'upi', 'card'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => { setPaymentMethod(method); setShowUpiQr(false); }}
                          className={`h-11 rounded-lg border font-medium text-sm transition-all flex items-center justify-center capitalize ${paymentMethod === method ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)] text-[var(--color-brand-600)] shadow-sm' : 'border-[var(--color-app-border)] text-[var(--color-app-muted)] hover:bg-gray-50'}`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="amountPaid" className="text-xs font-semibold">Amount Paid (₹)</Label>
                        <label className="flex items-center gap-1.5 text-xs text-[var(--color-app-text)] font-medium cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={isPartialPayment}
                            onChange={(e) => {
                              setIsPartialPayment(e.target.checked);
                              if (e.target.checked) setAmountPaidInput('');
                            }}
                            className="rounded border-[var(--color-app-border)] text-[var(--color-brand-600)] focus:ring-[var(--color-brand-500)] w-3.5 h-3.5"
                          />
                          Partial Payment
                        </label>
                      </div>
                      <Input
                        id="amountPaid"
                        type="number"
                        min="0"
                        disabled={!isPartialPayment}
                        placeholder={total.toFixed(2)}
                        value={isPartialPayment ? amountPaidInput : total.toFixed(2)}
                        onChange={(e) => { if (isPartialPayment) setAmountPaidInput(e.target.value); }}
                        className={`h-10 text-sm font-semibold ${!isPartialPayment ? 'bg-gray-50 text-[var(--color-app-muted)] cursor-not-allowed' : ''} ${isAmountPaidInvalid ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {isAmountPaidInvalid && (
                        <div className="text-xs text-red-500 font-medium">Cannot exceed ₹{total.toFixed(2)}</div>
                      )}
                      {isPartialPayment && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Remaining Balance:</span>
                          <span className="font-semibold text-red-600">
                            ₹{Math.max(0, total - (Number(amountPaidInput) || 0)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 md:p-6 border-t border-[var(--color-app-border)] bg-gray-50/50 space-y-3 md:space-y-4 shrink-0">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-[var(--color-app-muted)]">Total Payable:</span>
                <span className="text-xl font-bold text-[var(--color-brand-600)]">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex gap-3">
                {paymentMethod === 'upi' && showUpiQr ? (
                  <>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUpiQr(false)}>Back</Button>
                    <Button type="button" className="flex-1" disabled={checkingOut} onClick={handleCheckout}>
                      {checkingOut ? 'Processing...' : 'Payment Received'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCheckoutModalOpen(false)}>Cancel</Button>
                    {paymentMethod === 'upi' ? (
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={(showNewCustomerForm && !newCustomerName.trim()) || isFinalAmountInvalid || isAmountPaidInvalid}
                        onClick={() => setShowUpiQr(true)}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={checkingOut || (showNewCustomerForm && !newCustomerName.trim()) || isFinalAmountInvalid || isAmountPaidInvalid}
                        onClick={handleCheckout}
                      >
                        {checkingOut ? 'Processing...' : 'Confirm & Pay'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Inline Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProductCreated}
        initialData={createInitialData}
        context="outbound"
        title="Create & Add Product to Order"
        subtitle="Add product to catalog and add to current POS cart immediately"
      />
    </motion.div>
  );
}
