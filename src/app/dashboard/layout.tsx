import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--color-app-bg)] overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto">
        {/* Top padding on mobile to account for hamburger button */}
        <div className="max-w-7xl mx-auto p-4 pt-16 md:pt-8 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
