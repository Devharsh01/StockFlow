'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  PackagePlus, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Receipt, 
  Layers,
  LogOut,
  X,
  Menu,
  CloudUpload,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, adminOnly: false },
  { name: 'Inbound (Stock In)', href: '/dashboard/inbound', icon: PackagePlus, adminOnly: false },
  { name: 'Outbound (POS)', href: '/dashboard/outbound', icon: ShoppingCart, adminOnly: false },
  { name: 'Products', href: '/dashboard/products', icon: Package, adminOnly: false },
  { name: 'Bills', href: '/dashboard/bills', icon: Receipt, adminOnly: false },
  { name: 'Consignments', href: '/dashboard/consignments', icon: Layers, adminOnly: false },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, adminOnly: true },
  { name: 'Sheets Backup', href: '/dashboard/backup', icon: CloudUpload, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      if (data && data.role) {
        const roleName = String(data.role).toLowerCase();
        if (roleName.includes('admin') || roleName.includes('manager')) {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile in sidebar:', e);
    }
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    router.push('/login');
  };

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const NavContent = () => (
    <>
      <div className="h-16 md:h-20 flex items-center px-6 md:px-8 border-b border-[var(--color-app-border)] justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-brand-600)] flex items-center gap-2">
          <Package className="w-6 h-6" />
          StockFlow
        </h1>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[var(--color-app-muted)] transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 md:py-6 px-3 md:px-4 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="relative block">
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[var(--color-brand-50)] rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center gap-3 px-4 py-2.5 md:py-3 rounded-lg text-sm font-medium transition-colors z-10",
                isActive 
                  ? "text-[var(--color-brand-600)]" 
                  : "text-[var(--color-app-muted)] hover:bg-gray-50 hover:text-[var(--color-app-text)]"
              )}>
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 md:p-4 border-t border-[var(--color-app-border)] space-y-2">
        {isAdmin && (
          <Link href="/dashboard/users" className="block">
            <div
              className={`flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer ${
                pathname === '/dashboard/users'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold shadow-2xs'
                  : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Manage Users</span>
                  <span className="text-[10px] text-gray-500 block">Roles & Permissions</span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </Link>
        )}

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 md:py-3 w-full text-sm font-medium text-[var(--color-app-muted)] hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-[var(--color-app-border)] shadow-sm text-[var(--color-app-text)] hover:bg-gray-50 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[var(--color-app-border)] flex-col h-full shadow-[var(--shadow-premium)] z-10 relative shrink-0">
        <NavContent />
      </aside>

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar — slides in from left */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="md:hidden fixed top-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-white border-r border-[var(--color-app-border)] flex flex-col shadow-xl"
          >
            <NavContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
