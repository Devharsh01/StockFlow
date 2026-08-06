'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // In a real app, you would securely store tokens in HttpOnly cookies via server actions,
      // but for this MVP we'll store in localStorage to easily attach to fetch headers.
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user && data.user.role) {
        localStorage.setItem('userRole', data.user.role);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-app-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-brand-50)] text-[var(--color-brand-600)] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
            Welcome to StockFlow
          </h1>
          <p className="text-[var(--color-app-muted)] text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        <Card className="border-0 shadow-[var(--shadow-premium-hover)]">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  required 
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="p-3 bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)] text-sm rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
