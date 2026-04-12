import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "./ui/card";
import { cn } from "./ui/utils";

type StatMetricCardProps = {
  title: string;
  value: ReactNode;
  footnote?: string;
  icon: LucideIcon;
  loading?: boolean;
  className?: string;
};

export function StatMetricCard({
  title,
  value,
  footnote,
  icon: Icon,
  loading,
  className,
}: StatMetricCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {title}
        </CardDescription>
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {loading ? "–" : value}
        </p>
        {footnote ? (
          <p className="mt-2 text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
