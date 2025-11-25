'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminResetPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMessage('Password updated. You can close this tab.');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Reset password</h1>
          <p className="text-sm text-gray-300">Set a new password for your admin account.</p>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">{error}</div>}
        {message && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded p-3">{message}</div>}
        <form className="space-y-4" onSubmit={handleReset}>
          <div>
            <label className="text-sm text-gray-300">New password (min 8)</label>
            <input
              type="password"
              className="w-full mt-1 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Confirm password</label>
            <input
              type="password"
              className="w-full mt-1 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white outline-none"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition">
            Reset password
          </button>
          <div className="text-sm text-center">
            <Link href="/support/admin" className="text-blue-300 underline">
              Back to admin login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
