'use client';

import { useEffect, useMemo, useState } from 'react';

type Ticket = {
  id: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  website: string;
  createdAt: string;
  status: 'OPEN' | 'IN PROGRESS' | 'CLOSED';
  rating: number | null;
};

type View = 'email' | 'code' | 'tickets';

export default function CustomerPortalPage() {
  const [view, setView] = useState<View>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/customer/tickets', { cache: 'no-store' });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setTickets(data.tickets);
      setView('tickets');
      setMessage(null);
      setError(null);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/customer/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setMessage('Code sent to your email (expires in ~10 minutes).');
      setView('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/customer/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setCode('');
      await loadTickets();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/customer/logout', { method: 'POST' });
    setTickets([]);
    setView('email');
    setMessage('You have been signed out.');
  };

  const submitRating = async (ticketId: string, rating: number) => {
    try {
      const res = await fetch(`/api/customer/tickets/${ticketId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save rating');
      await loadTickets();
      setMessage('Thanks for your feedback!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const sortedTickets = useMemo(() => {
    return [...tickets].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [tickets]);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Ticket Portal</h1>
            <p className="text-sm text-gray-300">See your ticket updates and add feedback.</p>
          </div>
          {view === 'tickets' && (
            <button
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm"
              onClick={logout}
            >
              Sign out
            </button>
          )}
        </div>

        {message && <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">{message}</div>}
        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {view === 'email' && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Get a login code</h2>
            <p className="text-sm text-gray-300">Enter the email you used when submitting a ticket.</p>
            <form className="space-y-4" onSubmit={requestCode}>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send code'}
              </button>
            </form>
          </section>
        )}

        {view === 'code' && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Enter the code</h2>
            <p className="text-sm text-gray-300">We emailed a 6-digit code to {email}.</p>
            <form className="space-y-4" onSubmit={verifyCode}>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 outline-none tracking-[0.4em] text-center text-lg"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-60"
                >
                  {loading ? 'Checking...' : 'Verify'}
                </button>
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15"
                  onClick={() => setView('email')}
                >
                  Back
                </button>
              </div>
            </form>
          </section>
        )}

        {view === 'tickets' && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your tickets</h2>
              <button
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm"
                onClick={loadTickets}
              >
                Refresh
              </button>
            </div>
            {sortedTickets.length === 0 ? (
              <p className="text-sm text-gray-300">No tickets found for this email.</p>
            ) : (
              <div className="space-y-3">
                {sortedTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <p className="text-sm text-gray-300">{new Date(ticket.createdAt).toLocaleString()}</p>
                        <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                        <p className="text-sm text-gray-300">{ticket.website}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          ticket.status === 'OPEN'
                            ? 'bg-green-500/20 text-green-200'
                            : ticket.status === 'IN PROGRESS'
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : 'bg-gray-500/20 text-gray-200'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 whitespace-pre-line">{ticket.description}</p>
                    {ticket.status === 'CLOSED' && (
                      <div className="pt-2">
                        {ticket.rating ? (
                          <p className="text-sm text-gray-200">Your rating: {ticket.rating} / 5</p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-200">Rate this ticket:</p>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                className="text-yellow-300 text-lg hover:scale-110 transition"
                                onClick={() => submitRating(ticket.id, star)}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
