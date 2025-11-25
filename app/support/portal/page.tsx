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
  status: 'OPEN' | 'IN PROGRESS' | 'CLOSED' | 'REJECTED';
  rating: number | null;
  urgency: number;
  feedback: string | null;
  note: string | null;
  issueType: 'GENERAL' | 'WEBSITE';
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
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [ratingDraft, setRatingDraft] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Ticket['status']>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'RATED' | 'UNRATED'>('ALL');
  const [feedbackFilter, setFeedbackFilter] = useState<'ALL' | 'HAS' | 'NONE'>('ALL');

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

  const submitRating = async (ticketId: string, rating: number, feedback?: string) => {
    try {
      if (!rating || rating < 1 || rating > 5) {
        setError('Please pick a rating 1-5.');
        return;
      }
      setSavingId(ticketId);
      const res = await fetch(`/api/customer/tickets/${ticketId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save rating');
      await loadTickets();
      setMessage('Thanks for your feedback!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const sortedTickets = useMemo(() => {
    const base = [...tickets].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return base.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (ratingFilter === 'RATED' && !t.rating) return false;
      if (ratingFilter === 'UNRATED' && t.rating) return false;
      if (feedbackFilter === 'HAS' && !t.feedback) return false;
      if (feedbackFilter === 'NONE' && t.feedback) return false;
      return true;
    });
  }, [tickets, statusFilter, ratingFilter, feedbackFilter]);

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
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your tickets</h2>
              <button
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm"
                onClick={loadTickets}
              >
                Refresh
              </button>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="block text-gray-300 mb-1">Status</label>
                  <select
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="ALL">All</option>
                    <option value="OPEN">Open</option>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Rating</label>
                  <select
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-2"
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value as any)}
                  >
                    <option value="ALL">All</option>
                    <option value="RATED">Rated</option>
                    <option value="UNRATED">Not rated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Feedback</label>
                  <select
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-2"
                    value={feedbackFilter}
                    onChange={(e) => setFeedbackFilter(e.target.value as any)}
                  >
                    <option value="ALL">All</option>
                    <option value="HAS">Has feedback</option>
                    <option value="NONE">No feedback</option>
                  </select>
                </div>
              </div>
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
                    <p className="text-sm text-gray-300">Urgency: {ticket.urgency}</p>
                    {ticket.note && (
                      <p className="text-sm text-blue-200 mt-1">Note from support: {ticket.note}</p>
                    )}
                  </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          ticket.status === 'OPEN'
                            ? 'bg-green-500/20 text-green-200'
                            : ticket.status === 'IN PROGRESS'
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : ticket.status === 'CLOSED'
                            ? 'bg-gray-500/20 text-gray-200'
                            : 'bg-red-500/20 text-red-200'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 whitespace-pre-line">{ticket.description}</p>
                    {ticket.status === 'CLOSED' && (
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-200">Rate this ticket:</p>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const current = ratingDraft[ticket.id] ?? ticket.rating ?? 0;
                            const active = hoverRating !== null ? star <= hoverRating : star <= current;
                            return (
                              <button
                                key={star}
                                className={`text-lg transition ${active ? 'text-yellow-300' : 'text-gray-500'} hover:scale-110`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                onClick={() =>
                                  setRatingDraft((prev) => ({
                                    ...prev,
                                    [ticket.id]: star,
                                  }))
                                }
                              >
                                ★
                              </button>
                            );
                          })}
                          <span className="text-sm text-gray-300">
                            {(hoverRating ?? ratingDraft[ticket.id] ?? ticket.rating) ? `${hoverRating ?? ratingDraft[ticket.id] ?? ticket.rating} / 5` : ''}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm text-gray-300">Feedback (optional)</label>
                          <textarea
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm"
                            rows={2}
                            value={feedbackDraft[ticket.id] ?? ticket.feedback ?? ''}
                            onChange={(e) =>
                              setFeedbackDraft((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            className="px-4 py-2 rounded bg-white/10 border border-white/20 hover:bg-white/20 text-sm"
                            onClick={() =>
                              submitRating(
                                ticket.id,
                                ratingDraft[ticket.id] ?? ticket.rating ?? 0,
                                feedbackDraft[ticket.id] ?? ticket.feedback ?? ''
                              )
                            }
                            disabled={savingId === ticket.id}
                          >
                            {savingId === ticket.id ? 'Saving...' : 'Save rating & feedback'}
                          </button>
                        </div>
                        {ticket.feedback && !feedbackDraft[ticket.id] && (
                          <p className="text-sm text-gray-200">Your feedback: {ticket.feedback}</p>
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
