import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formatDateTime } from '@/lib/formatDate';
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton';
import {
  Search,
  Filter,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  ShoppingCart,
  Settings,
  Key,
  AlertTriangle,
  Info,
  AlertOctagon
} from 'lucide-react';
import { SEO } from '@/components/SEO';

interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // Joined profile data
  user_email?: string;
  user_name?: string;
}

const PAGE_SIZE = 20;

const ACTION_ICONS: Record<string, typeof Shield> = {
  login: Key,
  logout: Key,
  register: User,
  order: ShoppingCart,
  product: Package,
  partner: User,
  settings: Settings,
  security: AlertTriangle,
};

const SEVERITY_COLORS = {
  info: 'bg-[#D4AF37]/10 text-[#AA771C] border-[#D4AF37]/20',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-600 border-red-100',
};

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
};

function getEntityIcon(entityType: string | null) {
  if (!entityType) return Shield;
  const lower = entityType.toLowerCase();
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return Shield;
}

export function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (entityFilter !== 'all') {
      query = query.eq('entity_type', entityFilter);
    }

    if (severityFilter !== 'all') {
      query = query.eq('severity', severityFilter);
    }

    if (searchTerm) {
      query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%,entity_id.ilike.%${searchTerm}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Error fetching audit logs:', error);
      setIsLoading(false);
      return;
    }

    // Fetch user profiles for the user_ids
    const userIds = [...new Set((data || []).map(e => e.user_id).filter(Boolean))];
    let profileMap: Record<string, { email: string; full_name: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map(p => [p.id, { email: p.email, full_name: p.full_name }])
        );
      }
    }

    const enriched: AuditEntry[] = (data || []).map(entry => ({
      ...entry,
      user_email: entry.user_id ? profileMap[entry.user_id]?.email : undefined,
      user_name: entry.user_id ? profileMap[entry.user_id]?.full_name || undefined : undefined,
    }));

    setEntries(enriched);
    setTotalCount(count || 0);
    setIsLoading(false);
  }, [page, entityFilter, severityFilter, searchTerm]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAuditLogs();
    setIsRefreshing(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Get unique entity types for filter
  const entityTypes = ['all', 'order', 'product', 'partner', 'customer', 'invitation_code', 'settings', 'auth'];
  const severities = ['all', 'info', 'warning', 'critical'];

  return (
    <div className="space-y-6">
      <SEO title="Audit Log | Admin" description="Track all admin actions and system events." />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-foreground tracking-tight">System Audit Log</h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-[0.1em]">Security & Action History</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-6 py-2.5 bg-card border border-[#D4AF37]/30 text-[#AA771C] text-[10px] font-bold tracking-[0.2em] uppercase hover:border-[#D4AF37] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card p-6 border border-border shadow-sm rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions, entities, IDs..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-3 bg-muted border-none text-sm focus:ring-2 focus:ring-[#D4AF37]/20 transition-all rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
                className="bg-muted border-none text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-lg"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Entities' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
                className="bg-muted border-none text-sm px-4 py-3 pr-10 focus:ring-2 focus:ring-[#D4AF37]/20 rounded-lg"
              >
                {severities.map(sev => (
                  <option key={sev} value={sev}>
                    {sev === 'all' ? 'All Severities' : sev.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        <div className="flex items-center space-x-4">
          <span>{totalCount} Total Events</span>
          <span className="h-1 w-1 bg-slate-200 rounded-full" />
          <span>Page {page + 1} of {totalPages || 1}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Initiator</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Severity</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Entity</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IP Address</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableRowSkeleton columns={7} rows={8} />
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-foreground font-serif text-lg mb-1">No audit data</h3>
                      <p className="text-muted-foreground text-sm">We couldn't find any log entries matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : entries.map((entry) => {
                const Icon = getEntityIcon(entry.entity_type);
                const SevIcon = SEVERITY_ICONS[entry.severity] || Info;
                
                return (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-muted/80 transition-colors group">
                      <td className="px-6 py-5 text-sm text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">{formatDateTime(entry.created_at).split(',')[0]}</span>
                          <span className="text-[11px] text-muted-foreground font-mono uppercase">{formatDateTime(entry.created_at).split(',')[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-white shadow-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-serif text-foreground">{entry.user_name || 'System'}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{entry.user_email || 'automated-task'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${SEVERITY_COLORS[entry.severity]}`}>
                          <SevIcon className="h-3 w-3" />
                          <span>{entry.severity}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-muted rounded-lg group-hover:bg-card transition-colors">
                            <Icon className="h-4 w-4 text-[#AA771C]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground uppercase tracking-tight">{entry.entity_type || '—'}</p>
                            {entry.entity_id && (
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{entry.entity_id}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[11px] text-muted-foreground font-mono">
                        {entry.ip_address || '—'}
                      </td>
                      <td className="px-6 py-5">
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <button
                            onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                            className={`p-2 rounded-lg transition-all ${
                              expandedEntry === entry.id 
                                ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' 
                                : 'bg-muted text-muted-foreground hover:text-[#AA771C] hover:bg-[#D4AF37]/10'
                            }`}
                          >
                            {expandedEntry === entry.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedEntry === entry.id && entry.details && (
                      <tr>
                        <td colSpan={7} className="px-6 py-0">
                          <div className="my-4 p-6 bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative">
                            <div className="absolute top-4 right-6 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Payload Data</div>
                            <pre className="text-[11px] text-[#D4AF37]/90 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                              {JSON.stringify(entry.details, null, 4)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center space-x-2 px-6 py-2.5 bg-card border border-border text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:border-[#D4AF37] hover:text-[#AA771C] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-bold transition-all ${
                    page === pageNum
                      ? 'bg-[#111] text-[#D4AF37] shadow-lg shadow-black/20'
                      : 'text-muted-foreground hover:text-[#AA771C] hover:bg-[#D4AF37]/10'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center space-x-2 px-6 py-2.5 bg-card border border-border text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase hover:border-[#D4AF37] hover:text-[#AA771C] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>Next Page</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
