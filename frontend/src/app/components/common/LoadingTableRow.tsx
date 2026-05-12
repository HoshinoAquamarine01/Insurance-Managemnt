import { Skeleton } from "../ui/skeleton";
import { TableBody, TableCell, TableRow } from "../ui/table";

interface LoadingTableRowProps {
  columns: number;
  count?: number;
}

export function LoadingTableRow({ columns, count = 5 }: LoadingTableRowProps) {
  return (
    <TableBody>
      {Array.from({ length: count }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton className="h-6 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
