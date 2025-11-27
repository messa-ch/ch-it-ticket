'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

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
  note: string | null;
  feedback: string | null;
  issueType: 'GENERAL' | 'WEBSITE';
};

type TicketHistoryItem = {
  id: string;
  type: 'NOTE' | 'STATUS';
  author: string;
  authorRef: string | null;
  body: string;
  createdAt: string;
  toStatus?: Ticket['status'];
  fromStatus?: Ticket['status'] | null;
};

type View = 'login' | 'forgot' | 'dashboard';

const STATUS_ORDER: Ticket['status'][] = ['OPEN', 'IN PROGRESS', 'CLOSED', 'REJECTED'];
const URGENCY_OPTIONS = [5, 4, 3, 2, 1];

export default function AdminPage() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [noteSavingId, setNoteSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Ticket['status'][]>(['OPEN', 'IN PROGRESS']);
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'RATED' | 'UNRATED'>('ALL');
  const [feedbackFilter, setFeedbackFilter] = useState<'ALL' | 'HAS' | 'NONE'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<number[]>([...URGENCY_OPTIONS]);
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);
  const [historyTicketId, setHistoryTicketId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<TicketHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);
  const urgencyMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (urgencyMenuRef.current && !urgencyMenuRef.current.contains(event.target as Node)) {
        setShowUrgencyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const toggleStatus = async (id: string, status: Ticket['status']) => {
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

  const loadHistory = async (ticketId: string) => {
    setHistoryTicketId(ticketId);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/notes`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load history');
      setHistoryItems(data.history || []);
    } catch (err) {
      setHistoryError((err as Error).message);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setForgotSent(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formattedTickets = useMemo(() => {
    return tickets.map((t) => ({
      ...t,
      createdLabel: new Date(t.createdAt).toLocaleString(),
      createdAtMs: new Date(t.createdAt).getTime(),
      note: t.note ?? '',
      feedback: t.feedback ?? '',
    }));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return formattedTickets
      .filter((t) => {
        if (statusFilter.length && !statusFilter.includes(t.status)) return false;
        if (urgencyFilter.length && !urgencyFilter.includes(t.urgency)) return false;
        if (ratingFilter === 'RATED' && !t.rating) return false;
        if (ratingFilter === 'UNRATED' && t.rating) return false;
        if (feedbackFilter === 'HAS' && !t.feedback) return false;
        if (feedbackFilter === 'NONE' && t.feedback) return false;
        return true;
      })
      .sort((a, b) => {
        const statusRank = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
        if (statusRank !== 0) return statusRank;
        const urgencyRank = (b.urgency || 0) - (a.urgency || 0);
        if (urgencyRank !== 0) return urgencyRank;
        return a.createdAtMs - b.createdAtMs; // oldest first within status
      });
  }, [formattedTickets, statusFilter, ratingFilter, feedbackFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { OPEN: 0, 'IN PROGRESS': 0, CLOSED: 0, REJECTED: 0 };
    for (const t of tickets) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
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
      <div className="max-w-7xl mx-auto space-y-8">
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

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
            {error}
          </div>
        )}

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-xl font-semibold">Tickets</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-white/10 border border-white/20">Open: {statusCounts.OPEN}</span>
                <span className="px-2 py-1 rounded bg-white/10 border border-white/20">In Progress: {statusCounts['IN PROGRESS']}</span>
                <span className="px-2 py-1 rounded bg-white/10 border border-white/20">Closed: {statusCounts.CLOSED}</span>
                <span className="px-2 py-1 rounded bg-white/10 border border-white/20">Rejected: {statusCounts.REJECTED}</span>
              </div>
              <button
                onClick={loadTickets}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 text-sm"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="space-y-2">
                <label className="block text-gray-300 mb-1">Status (multi-select)</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.map((status) => {
                    const active = statusFilter.includes(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setStatusFilter((prev) => {
                            const next = new Set(prev);
                            if (next.has(status)) {
                              next.delete(status);
                            } else {
                              next.add(status);
                            }
                            return Array.from(next);
                          })
                        }
                        className={`px-3 py-1 rounded-full text-xs border ${
                          active
                            ? 'bg-white text-black border-white'
                            : 'bg-black/20 border-white/20 text-gray-200 hover:bg-white/10'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setStatusFilter([...STATUS_ORDER])}
                    className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter([])}
                    className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-gray-400">Defaults to Open + In Progress.</p>
              </div>
              <div className="space-y-2 relative" ref={urgencyMenuRef}>
                <label className="block text-gray-300 mb-1">Urgency (multi-select)</label>
                <button
                  type="button"
                  onClick={() => setShowUrgencyMenu((prev) => !prev)}
                  className="w-full flex items-center justify-between bg-black/30 border border-white/10 rounded px-3 py-2 text-left hover:border-white/30 transition"
                >
                  <span className="text-sm text-gray-100">
                    {urgencyFilter.length === URGENCY_OPTIONS.length
                      ? 'All'
                      : urgencyFilter.length === 0
                      ? 'None selected'
                      : urgencyFilter.slice().sort((a, b) => b - a).join(', ')}
                  </span>
                  <span className="text-xs text-gray-400">▼</span>
                </button>
                {showUrgencyMenu && (
                  <div className="absolute z-20 mt-1 w-full bg-slate-900 border border-white/15 rounded-lg shadow-xl p-2 space-y-1">
                    {URGENCY_OPTIONS.map((u) => {
                      const checked = urgencyFilter.includes(u);
                      return (
                        <label
                          key={u}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-sm text-gray-100"
                        >
                          <input
                            type="checkbox"
                            className="accent-white"
                            checked={checked}
                            onChange={() =>
                              setUrgencyFilter((prev) => {
                                const next = new Set(prev);
                                if (next.has(u)) {
                                  next.delete(u);
                                } else {
                                  next.add(u);
                                }
                                return Array.from(next);
                              })
                            }
                          />
                          Urgency {u}
                        </label>
                      );
                    })}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-gray-100 hover:bg-white/20"
                        onClick={() => setUrgencyFilter([...URGENCY_OPTIONS])}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-gray-100 hover:bg-white/20"
                        onClick={() => setUrgencyFilter([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
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
          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-[1200px] w-full text-sm">
                <thead className="text-gray-300 sticky top-0 bg-slate-950">
                  <tr className="border-b border-white/10">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Urgency</th>
                  <th className="text-left p-2">Website</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2 w-[280px]">Note (visible to customer)</th>
                  <th className="text-left p-2">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5">
                    <td className="p-2">{ticket.name}</td>
                    <td className="p-2">{ticket.email}</td>
                    <td className="p-2">
                      <button
                        className="text-left underline text-blue-200 hover:text-blue-50 hover:shadow-[0_0_10px_rgba(255,255,255,0.25)] transition rounded px-1"
                        onClick={() => setOpenSubjectId(ticket.id)}
                        title="Click to view full description"
                      >
                        {ticket.subject}
                      </button>
                    </td>
                    <td className="p-2">{ticket.issueType === 'GENERAL' ? 'General' : 'Website'}</td>
                    <td className="p-2">{ticket.urgency}</td>
                    <td className="p-2">{ticket.website}</td>
                    <td className="p-2 text-gray-300">{ticket.createdLabel}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          ticket.status === 'OPEN'
                            ? 'bg-green-500/20 text-green-300'
                            : ticket.status === 'IN PROGRESS'
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : ticket.status === 'CLOSED'
                            ? 'bg-gray-500/20 text-gray-200'
                            : 'bg-red-500/20 text-red-300'
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
                          toggleStatus(ticket.id, e.target.value as Ticket['status'])
                        }
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                    <td className="p-2 align-top w-[280px]">
                      <textarea
                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm min-h-[90px]"
                        rows={2}
                        value={noteDrafts[ticket.id] ?? ticket.note ?? ''}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          className="text-xs px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
                          onClick={async () => {
                            setNoteSavingId(ticket.id);
                            try {
                              const res = await fetch(`/api/admin/tickets/${ticket.id}/note`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ note: noteDrafts[ticket.id] ?? ticket.note ?? '' }),
                              });
                              if (!res.ok) throw new Error('Failed to save note');
                              await loadTickets();
                              if (historyTicketId === ticket.id) {
                                await loadHistory(ticket.id);
                              }
                            } catch (err) {
                              setError((err as Error).message);
                            } finally {
                              setNoteSavingId(null);
                            }
                          }}
                          disabled={noteSavingId === ticket.id}
                        >
                          {noteSavingId === ticket.id ? 'Saving...' : 'Save note'}
                        </button>
                        <button
                          className="text-xs px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
                          onClick={() => loadHistory(ticket.id)}
                        >
                          View history
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-sm text-gray-200 whitespace-pre-line align-top">
                      {ticket.feedback || '—'}
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-400" colSpan={11}>
                      No tickets match the current filters.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      {openSubjectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">Ticket details</h3>
              <button
                className="text-sm px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
                onClick={() => setOpenSubjectId(null)}
              >
                Close
              </button>
            </div>
            {(() => {
              const ticket = formattedTickets.find((t) => t.id === openSubjectId);
              if (!ticket) return <p className="text-sm text-gray-300">Ticket not found.</p>;
              return (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300"><span className="font-semibold text-white">Subject:</span> {ticket.subject}</p>
                  <p className="text-sm text-gray-300"><span className="font-semibold text-white">Email:</span> {ticket.email}</p>
                  <p className="text-sm text-gray-300"><span className="font-semibold text-white">Created:</span> {ticket.createdLabel}</p>
                  <div className="text-sm text-gray-100 whitespace-pre-wrap border border-white/10 rounded-lg p-3 bg-black/20">
                    {ticket.description}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {historyTicketId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">Ticket history</h3>
              <button
                className="text-sm px-3 py-1 rounded bg-white/10 border border-white/20 hover:bg-white/20"
                onClick={() => {
                  setHistoryTicketId(null);
                  setHistoryItems([]);
                  setHistoryError(null);
                }}
              >
                Close
              </button>
            </div>
            {historyLoading && <p className="text-sm text-gray-300">Loading history...</p>}
            {historyError && <p className="text-sm text-red-300">{historyError}</p>}
            {!historyLoading && !historyError && (
              <div className="space-y-3">
                {historyItems.length === 0 && (
                  <p className="text-sm text-gray-300">No history yet.</p>
                )}
                {historyItems.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-white/10 rounded-lg p-3 bg-black/20"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                      <span className="font-semibold text-white">
                        {entry.type === 'STATUS' ? 'Status update' : entry.author}
                        {entry.authorRef ? ` (${entry.authorRef})` : ''}
                      </span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap">{entry.body}</p>
                    {entry.type === 'STATUS' && entry.toStatus && (
                      <div className="flex items-center gap-2 text-xs text-gray-200 mt-2">
                        <span className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white">
                          {entry.toStatus}
                        </span>
                        {entry.fromStatus && (
                          <span className="text-gray-300">from {entry.fromStatus}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
