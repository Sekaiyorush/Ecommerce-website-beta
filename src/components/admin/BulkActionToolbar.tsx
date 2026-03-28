import { X, CheckSquare } from 'lucide-react';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  onSelectAll,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-16 z-30 bg-foreground text-background rounded-lg shadow-xl p-3 flex items-center justify-between animate-in slide-in-from-bottom-2">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
          <span className="text-sm font-medium">{selectedCount} selected</span>
        </div>
        {selectedCount < totalCount && (
          <button
            onClick={onSelectAll}
            className="text-xs text-[#D4AF37] hover:text-[#F3E5AB] underline transition-colors"
          >
            Select all {totalCount}
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              action.variant === 'danger'
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
        <button
          onClick={onClearSelection}
          className="p-1.5 hover:bg-white/10 rounded transition-colors ml-2"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
