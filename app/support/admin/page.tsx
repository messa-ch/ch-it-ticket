'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Ticket = {
  id: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  website: string;
  createdAt: string;
  status: 'OPEN' | 'CLOSED';
};

type View = 'login' | 'forgot' | 'dashboard';

export default function AdminPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [changePwState, setChangePwState] = useState({ currentPassword: '', newPassword: '', message: '' });
  const [forgotSent, setForgotSent] = useState(false);

  const loadSession = async () => {
    try {
      const res = await fetch('/api/admin/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCurrentAdmin(data.email);
        setView('dashboard');
        await loadTickets();
      } else {
        setCurrentAdmin(null);
        setView('login');
      }
    } catch {
      setCurrentAdmin(null);
      setView('login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/admin/tickets', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(data.tickets);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }
      await loadSession();
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setCurrentAdmin(null);
    setTickets([]);
    setView('login');
  };

  const toggleStatus = async (id: string, status: 'OPEN' | 'IN PROGRESS' | 'CLOSED') => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await loadTickets();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwState((s) => ({ ...s, message: '' }));
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changePwState.currentPassword,
          newPassword: changePwState.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setChangePwState({ currentPassword: '', newPassword: '', message: 'Password changed' });
    } catch (err) {
      setChangePwState((s) => ({ ...s, message: (err as Error).message }));
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send reset email');
      setForgotSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formattedTickets = useMemo(() => {
    return tickets.map((t) => ({
      ...t,
      createdLabel: new Date(t.createdAt).toLocaleString(),
    }));
  }, [tickets]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-lg">Loading...</div>
      </main>
    );
  }

  if (view === 'login') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Admin Login</h1>
            <p className="text-sm text-gray-300">Only approved admins can sign in.</p>
          </div>
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">{error}</div>}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Password</label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
              disabled={isLoading}
            >
              Sign in
            </button>
            <div className="text-sm text-center">
              <button type="button" className="text-blue-300 underline" onClick={() => setView('forgot')}>
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (view === 'forgot') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Reset password</h1>
            <p className="text-sm text-gray-300">We will email a reset link if the account exists.</p>
          </div>
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">{error}</div>}
          {forgotSent && <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded p-3">If the account exists, a reset link was emailed.</div>}
          <form className="space-y-4" onSubmit={handleForgot}>
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <input
                type="email"
                className="w-full mt-1 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Send reset link
            </button>
            <div className="text-sm text-center">
              <button type="button" className="text-blue-300 underline" onClick={() => setView('login')}>
                Back to login
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Support Admin</h1>
            <p className="text-sm text-gray-300">Signed in as {currentAdmin}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/support" className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15">
              Back to support
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500">
              Logout
            </button>
          </div>
        </div>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Change password</h2>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleChangePassword}>
            <input
              type="password"
              placeholder="Current password"
              className="px-4 py-3 rounded-lg bg-black/30 border border-white/10 outline-none"
              value={changePwState.currentPassword}
              onChange={(e) => setChangePwState((s) => ({ ...s, currentPassword: e.target.value }))}
            />
            <input
              type="password"
              placeholder="New password (min 8)"
              className="px-4 py-3 rounded-lg bg-black/30 border border-white/10 outline-none"
              value={changePwState.newPassword}
              onChange={(e) => setChangePwState((s) => ({ ...s, newPassword: e.target.value }))}
            />
            <button type="submit" className="px-4 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200">
              Update
            </button>
          </form>
          {changePwState.message && <p className="text-sm text-gray-200">{changePwState.message}</p>}
        </section>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
            {error}
          </div>
        )}

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tickets (createdAt asc)</h2>
            <button
              onClick={loadTickets}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-gray-300">
                <tr className="border-b border-white/10">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Website</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {formattedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5">
                    <td className="p-2">{ticket.name}</td>
                    <td className="p-2">{ticket.email}</td>
                    <td className="p-2">{ticket.subject}</td>
                    <td className="p-2">{ticket.website}</td>
                    <td className="p-2 text-gray-300">{ticket.createdLabel}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          ticket.status === 'OPEN' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-200'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs"
                        value={ticket.status}
                        onChange={(e) =>
                          toggleStatus(ticket.id, e.target.value as 'OPEN' | 'IN PROGRESS' | 'CLOSED')
                        }
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {formattedTickets.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-400" colSpan={7}>
                      No tickets yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
