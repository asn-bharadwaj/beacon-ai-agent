'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Clock, CheckCircle, PhoneCall, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface EscalationTicket {
  ticket_id: string;
  name: string;
  issue: string;
  checked: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  language: string;
  followup_method: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  created_at: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>('All');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/escalations');
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticket_id: string, status: 'Open' | 'In Progress' | 'Resolved' | 'Closed') => {
    try {
      const res = await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id, status }),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      
      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticket_id ? { ...t, status } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(
    (t) => filter === 'All' || t.status === filter
  );

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
  };

  return (
    <main className="beacon-bg flex min-h-svh w-full flex-col p-6 md:p-12 lg:px-24">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between pb-8">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full border-border/10 bg-card/40 hover:bg-card/75 text-foreground cursor-pointer"
            asChild
          >
            <a href="/">
              <ArrowLeft className="size-4" />
            </a>
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Teacher Help Desk
            </h1>
            <p className="text-muted-foreground text-xs font-semibold mt-1">
              Beacon voice agent human escalations console
            </p>
          </div>
        </div>

        <Button
          onClick={fetchTickets}
          variant="outline"
          size="sm"
          className="border-border/10 bg-card/40 hover:bg-card/75 text-foreground flex items-center gap-2 cursor-pointer rounded-xl"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          <span>Refresh</span>
        </Button>
      </header>

      {/* Main Grid */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 items-start md:grid-cols-[250px_1fr]">
        
        {/* Sidebar stats */}
        <aside className="border-border/10 bg-card/30 rounded-2xl border p-5 backdrop-blur-md select-none space-y-4">
          <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">Tickets Summary</h2>
          <div className="space-y-2">
            {[
              { label: 'All Requests', count: stats.total, key: 'All', color: 'border-border/15' },
              { label: 'Open Help', count: stats.open, key: 'Open', color: 'border-rose-500/20 text-rose-500' },
              { label: 'In Progress', count: stats.inProgress, key: 'In Progress', color: 'border-amber-500/20 text-amber-500' },
              { label: 'Resolved', count: stats.resolved, key: 'Resolved', color: 'border-emerald-500/20 text-emerald-500' },
              { label: 'Closed Tickets', count: stats.closed, key: 'Closed', color: 'border-slate-500/20 text-slate-400' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={cn(
                  'flex w-full items-center justify-between border rounded-xl p-3 text-xs font-semibold transition-all cursor-pointer hover:bg-card/40',
                  filter === item.key
                    ? 'bg-card/60 shadow-xs border-primary/20 scale-[1.02]'
                    : 'bg-transparent border-transparent text-muted-foreground'
                )}
              >
                <span>{item.label}</span>
                <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold bg-card/60', item.color)}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Tickets Feed */}
        <div className="space-y-4">
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border p-5 text-center text-sm leading-relaxed">
              <p className="font-bold">Connection Error</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!loading && filteredTickets.length === 0 && (
            <div className="border-border/10 bg-card/20 rounded-2xl border p-12 text-center text-muted-foreground text-sm backdrop-blur-md">
              <p className="font-semibold text-foreground">All Quiet Here</p>
              <p className="mt-1">No support tickets found matching the selected filter.</p>
            </div>
          )}

          {loading && filteredTickets.length === 0 && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 w-full bg-card/20 border border-border/10 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {filteredTickets.map((ticket) => (
            <div
              key={ticket.ticket_id}
              className={cn(
                'border-border/10 bg-card/35 relative flex flex-col rounded-2xl border p-6 transition-all duration-300 backdrop-blur-md shadow-lg',
                ticket.status === 'Open' && 'border-rose-500/10 hover:border-rose-500/20',
                ticket.status === 'In Progress' && 'border-amber-500/10 hover:border-amber-500/20',
                ticket.status === 'Resolved' && 'border-emerald-500/10 hover:border-emerald-500/20',
                ticket.status === 'Closed' && 'border-slate-500/10 opacity-70 grayscale-25 hover:opacity-90'
              )}
            >
              {/* Row 1: Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/5 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black tracking-wider text-primary">
                    {ticket.ticket_id}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border',
                      ticket.urgency === 'emergency' && 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse',
                      ticket.urgency === 'high' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      ticket.urgency === 'medium' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                      ticket.urgency === 'low' && 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    )}
                  >
                    {ticket.urgency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Status:</span>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.ticket_id, e.target.value as any)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-card border-border/10 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary',
                      ticket.status === 'Open' && 'text-rose-500 border-rose-500/25',
                      ticket.status === 'In Progress' && 'text-amber-500 border-amber-500/25',
                      ticket.status === 'Resolved' && 'text-emerald-500 border-emerald-500/25',
                      ticket.status === 'Closed' && 'text-slate-400 border-slate-500/25'
                    )}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Ticket info */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 pt-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Problem Description</span>
                    <p className="text-foreground text-sm font-semibold mt-1 leading-relaxed">
                      {ticket.issue}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">What was Checked / covered</span>
                    <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                      {ticket.checked}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-card/25 border border-border/5 rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Learner Name</span>
                    <p className="text-foreground font-bold mt-0.5">{ticket.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Language</span>
                    <p className="text-foreground font-bold mt-0.5">{ticket.language}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Preferred Follow-up</span>
                    <div className="flex items-center gap-1.5 text-foreground font-semibold mt-1">
                      {ticket.followup_method.toLowerCase().includes('phone') ? (
                        <PhoneCall className="size-3 text-emerald-500" />
                      ) : (
                        <Mail className="size-3 text-indigo-500" />
                      )}
                      <span>{ticket.followup_method}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Timestamp */}
              <div className="border-t border-border/5 mt-4 pt-3 flex items-center justify-between text-[10px] text-muted-foreground font-medium select-none">
                <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                {ticket.status !== 'Closed' && (
                  <Button
                    onClick={() => updateTicketStatus(ticket.ticket_id, 'Closed')}
                    variant="destructive"
                    size="sm"
                    className="h-7 rounded-lg text-[9px] px-2.5 font-bold uppercase cursor-pointer"
                  >
                    Close Ticket
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
