import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface LoadingCardProps {
  count?: number;
}

export function LoadingCard({ count = 1 }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
