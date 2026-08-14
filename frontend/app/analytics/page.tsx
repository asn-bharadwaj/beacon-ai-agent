'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Phone, Globe, Award, TrendingUp, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface CallRecord {
  room_name: string;
  channel: 'browser' | 'sip';
  duration: number;
  user_turns: number;
  success: boolean;
  failure_reason: 'early_hangup' | 'incomplete_lesson' | null;
  created_at: string;
}

interface AnalyticsData {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  history: CallRecord[];
}

// Rich demo data for demonstration purposes
const DEMO_HISTORY: CallRecord[] = [
  { room_name: "RM_browser_lesson1", channel: "browser", duration: 112.5, user_turns: 6, success: true, failure_reason: null, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { room_name: "SIP_traindrivertim_72", channel: "sip", duration: 8.2, user_turns: 0, success: false, failure_reason: "early_hangup", created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { room_name: "RM_browser_lesson2", channel: "browser", duration: 84.1, user_turns: 4, success: true, failure_reason: null, created_at: new Date(Date.now() - 120 * 60000).toISOString() },
  { room_name: "SIP_traindrivertim_65", channel: "sip", duration: 42.6, user_turns: 2, success: true, failure_reason: null, created_at: new Date(Date.now() - 180 * 60000).toISOString() },
  { room_name: "RM_browser_lesson3", channel: "browser", duration: 25.4, user_turns: 1, success: false, failure_reason: "incomplete_lesson", created_at: new Date(Date.now() - 240 * 60000).toISOString() },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    total: 0,
    success: 0,
    failed: 0,
    successRate: 0,
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  
  // Filters
  const [channelFilter, setChannelFilter] = useState<'all' | 'browser' | 'sip'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'success' | 'failure'>('all');

  const fetchAnalytics = async () => {
    if (useDemo) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load analytics data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (useDemo) {
      const total = DEMO_HISTORY.length;
      const success = DEMO_HISTORY.filter(c => c.success).length;
      const failed = total - success;
      setData({
        total,
        success,
        failed,
        successRate: total > 0 ? Math.round((success / total) * 100) : 0,
        history: DEMO_HISTORY
      });
      setLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [useDemo]);

  const toggleDemoMode = () => {
    setUseDemo(!useDemo);
  };

  const filteredHistory = data.history.filter(record => {
    const matchesChannel = channelFilter === 'all' || record.channel === channelFilter;
    const matchesOutcome = outcomeFilter === 'all' || 
      (outcomeFilter === 'success' && record.success) || 
      (outcomeFilter === 'failure' && !record.success);
    return matchesChannel && matchesOutcome;
  });

  // Calculate detailed aggregates
  const browserCount = data.history.filter(c => c.channel === 'browser').length;
  const sipCount = data.history.filter(c => c.channel === 'sip').length;
  
  const earlyHangups = data.history.filter(c => c.failure_reason === 'early_hangup').length;
  const incompleteLessons = data.history.filter(c => c.failure_reason === 'incomplete_lesson').length;

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
              Call Analytics
            </h1>
            <p className="text-muted-foreground text-xs font-semibold mt-1">
              Real-time performance indicators and success rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={toggleDemoMode}
            variant="outline"
            size="sm"
            className={cn(
              "border-border/10 text-xs font-bold rounded-xl cursor-pointer transition-all",
              useDemo ? "bg-amber-500/10 text-amber-500 border-amber-500/25" : "bg-card/40 hover:bg-card/75"
            )}
          >
            {useDemo ? "Disable Demo Mode" : "Load Demo Data"}
          </Button>

          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            disabled={useDemo}
            className="border-border/10 bg-card/40 hover:bg-card/75 text-foreground flex items-center gap-2 cursor-pointer rounded-xl"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>
      </header>

      {/* Analytics Main Container */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        
        {/* Connection status banner for demo mode */}
        {useDemo && (
          <div className="border-amber-500/20 bg-amber-500/5 text-amber-500 rounded-2xl border p-4 text-xs font-bold flex items-center gap-3">
            <span className="size-2 animate-ping bg-amber-500 rounded-full" />
            Showing demo data. Click "Disable Demo Mode" to load actual call statistics from the sqlite database file.
          </div>
        )}

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Calls', value: data.total, icon: Globe, color: 'text-sky-500', bg: 'from-sky-500/5 to-sky-500/0' },
            { label: 'Success Rate', value: `${data.successRate}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'from-emerald-500/5 to-emerald-500/0' },
            { label: 'Successful Calls', value: data.success, icon: Award, color: 'text-emerald-500', bg: 'from-emerald-500/5 to-emerald-500/0' },
            { label: 'Failed Calls', value: data.failed, icon: AlertTriangle, color: 'text-rose-500', bg: 'from-rose-500/5 to-rose-500/0' },
          ].map((card, idx) => (
            <div
              key={idx}
              className={cn(
                'border-border/10 bg-card/30 rounded-2xl border p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between h-36',
                `bg-gradient-to-br ${card.bg}`
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{card.label}</span>
                <card.icon className={cn('size-4', card.color)} />
              </div>
              <div className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-4">
                {loading && data.total === 0 ? '...' : card.value}
              </div>
            </div>
          ))}
        </section>

        {/* Charts and Distributions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Channel Distribution */}
          <div className="border-border/10 bg-card/30 rounded-2xl border p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-foreground text-xs font-bold tracking-wider uppercase mb-1">Channel Distribution</h2>
              <p className="text-muted-foreground text-[10px]">Calls handled by channel (Browser vs Telephone SIP Trunk)</p>
            </div>
            
            <div className="py-6 flex items-center justify-center gap-12">
              {/* Custom SVG Pie Chart */}
              <div className="relative size-32">
                <svg viewBox="0 0 36 36" className="size-full">
                  <path
                    className="text-muted/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {data.total > 0 && (
                    <path
                      className="text-emerald-500"
                      strokeWidth="3.5"
                      strokeDasharray={`${(browserCount / data.total) * 100}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                  {data.total > 0 && (
                    <path
                      className="text-sky-500"
                      strokeWidth="3.5"
                      strokeDashoffset={-((browserCount / data.total) * 100)}
                      strokeDasharray={`${(sipCount / data.total) * 100}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold">{data.total}</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Calls</span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Browser Calls</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{browserCount} ({data.total > 0 ? Math.round((browserCount / data.total) * 100) : 0}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-sky-500" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">SIP Telephony</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{sipCount} ({data.total > 0 ? Math.round((sipCount / data.total) * 100) : 0}%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Failure Reasons Analysis */}
          <div className="border-border/10 bg-card/30 rounded-2xl border p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-foreground text-xs font-bold tracking-wider uppercase mb-1">Failure Categories</h2>
              <p className="text-muted-foreground text-[10px]">Distribution of failed calls by reason category</p>
            </div>
            
            <div className="py-6 space-y-4">
              {/* Category 1: Early Hangup */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted-foreground">Early Hangup (&lt; 2 turns)</span>
                  <span>{earlyHangups} calls</span>
                </div>
                <div className="w-full bg-border/10 rounded-full h-2 relative">
                  <div 
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${data.failed > 0 ? (earlyHangups / data.failed) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Category 2: Incomplete Lesson */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted-foreground">Incomplete Lesson/Task</span>
                  <span>{incompleteLessons} calls</span>
                </div>
                <div className="w-full bg-border/10 rounded-full h-2 relative">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${data.failed > 0 ? (incompleteLessons / data.failed) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Filters and History Log */}
        <section className="border-border/10 bg-card/30 rounded-2xl border p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/5 pb-4">
            <div>
              <h2 className="text-foreground text-xs font-bold tracking-wider uppercase mb-1">Call Logs History</h2>
              <p className="text-muted-foreground text-[10px]">Metadata records of all past incoming and outgoing sessions</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Channel Filter */}
              <div className="flex items-center gap-1 bg-border/5 rounded-lg border border-border/10 p-0.5 text-[10px] font-bold">
                {['all', 'browser', 'sip'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch as any)}
                    className={cn(
                      'rounded-md px-2.5 py-1 uppercase transition-all cursor-pointer',
                      channelFilter === ch ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {/* Outcome Filter */}
              <div className="flex items-center gap-1 bg-border/5 rounded-lg border border-border/10 p-0.5 text-[10px] font-bold">
                {['all', 'success', 'failure'].map(out => (
                  <button
                    key={out}
                    onClick={() => setOutcomeFilter(out as any)}
                    className={cn(
                      'rounded-md px-2.5 py-1 uppercase transition-all cursor-pointer',
                      outcomeFilter === out ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {out}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History List Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/10 text-muted-foreground uppercase text-[9px] font-bold tracking-widest">
                  <th className="py-3 px-4">Room/Call ID</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">User Turns</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {filteredHistory.map((call, idx) => (
                  <tr key={idx} className="hover:bg-card/25 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {call.room_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {call.channel === 'sip' ? (
                          <>
                            <Phone className="size-3 text-sky-500" />
                            <span className="font-semibold text-sky-500">SIP Call</span>
                          </>
                        ) : (
                          <>
                            <Globe className="size-3 text-emerald-500" />
                            <span className="font-semibold text-emerald-500">Browser</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {call.duration}s
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {call.user_turns}
                    </td>
                    <td className="py-3.5 px-4">
                      {call.success ? (
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          Success
                        </span>
                      ) : (
                        <span 
                          title={`Reason: ${call.failure_reason}`}
                          className="bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider cursor-help"
                        >
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">
                      {new Date(call.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No matching call records found.
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
