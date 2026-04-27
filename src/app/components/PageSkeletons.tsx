import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function DashboardSkeleton({ showUserTable = false }: { showUserTable?: boolean }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>

      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-52 w-full rounded-none" />
              <CardContent className="space-y-3 pt-4">
                <Skeleton className="h-5 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {showUserTable && (
        <Card className="overflow-hidden">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-10 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-10" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function UserManagementSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="space-y-6 bg-slate-900 px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-52 bg-white/10" />
                <Skeleton className="h-4 w-56 bg-white/10" />
                <Skeleton className="h-6 w-24 bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-10 w-28 bg-white/10" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </Card>
      </div>
    </div>
  );
}

export function ClassDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-44" />
      <Skeleton className="h-72 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ClassAssignmentsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />

      <Card className="p-6 space-y-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </Card>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="space-y-3 p-6">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="border-t p-6 space-y-4">
              {Array.from({ length: 2 }).map((__, taskIndex) => (
                <div key={taskIndex} className="space-y-3">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-10 w-32" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SubmissionListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-44" />

      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-80" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-12 w-16" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Skeleton className="h-8 w-52" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function UserProgressSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-56" />

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-60 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
