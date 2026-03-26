import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { formatDateTime } from '@/lib/formatDate';
import { Send, MessageSquare, Lock } from 'lucide-react';

interface OrderNote {
  id: string;
  order_id: string;
  user_id: string;
  note: string;
  is_internal: boolean;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface OrderNotesProps {
  orderId: string;
}

export function OrderNotes({ orderId }: OrderNotesProps) {
  const { user } = useAuth();
  const { logAudit } = useDatabase();
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchNotes = async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('order_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching order notes:', error);
      setIsLoading(false);
      return;
    }

    // Enrich with user data
    const userIds = [...new Set((data || []).map(n => n.user_id))];
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

    const enriched = (data || []).map(note => ({
      ...note,
      user_name: profileMap[note.user_id]?.full_name || undefined,
      user_email: profileMap[note.user_id]?.email || undefined,
    }));

    setNotes(enriched);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user || !orderId) return;

    setIsSending(true);

    const { error } = await supabase.from('order_notes').insert({
      order_id: orderId,
      user_id: user.id,
      note: newNote.trim(),
      is_internal: isInternal,
    });

    if (error) {
      logger.error('Error adding note:', error);
      setIsSending(false);
      return;
    }

    // Log audit
    logAudit('create_note', 'order', orderId, { note_preview: newNote.trim().slice(0, 100), is_internal: isInternal });

    setNewNote('');
    setIsSending(false);
    fetchNotes();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm text-foreground">Order Notes</h4>
        <span className="text-xs text-muted-foreground">({notes.length})</span>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border border-border border-t-slate-500 rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={`p-3 rounded-lg text-sm ${note.user_id === user?.id
                ? 'bg-blue-50 border border-blue-100 ml-4'
                : 'bg-muted border border-border mr-4'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground text-xs">
                    {note.user_name || note.user_email || 'Unknown'}
                  </span>
                  {note.is_internal && (
                    <span className="flex items-center space-x-1 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Internal</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">{formatDateTime(note.created_at)}</span>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{note.note}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-slate-200 focus:border-border resize-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-border text-foreground focus:ring-slate-200"
            />
            <span className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>Internal note (admin only)</span>
            </span>
          </label>
          <button
            type="submit"
            disabled={isSending || !newNote.trim()}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            <span>{isSending ? 'Sending...' : 'Add Note'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
