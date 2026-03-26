import { Skeleton } from '@/components/ui/skeleton';

interface TableRowSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableRowSkeleton({ columns = 5, rows = 5 }: TableRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-border">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <Skeleton
                className={`h-4 bg-muted ${
                  colIdx === 0 ? 'w-24' : colIdx === columns - 1 ? 'w-16' : 'w-20'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
