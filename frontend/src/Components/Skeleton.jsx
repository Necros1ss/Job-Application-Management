const SkeletonLine = ({ className = "" }) => (
  <div className={`rounded-full bg-gray-100 ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-5">
      <div className="w-14 h-14 bg-gray-100 rounded-xl" />
      <SkeletonLine className="w-20 h-6" />
    </div>
    <SkeletonLine className="w-3/4 h-5 mb-3" />
    <SkeletonLine className="w-1/2 h-4 mb-5" />
    <div className="space-y-2.5 mb-6">
      <SkeletonLine className="w-full h-3" />
      <SkeletonLine className="w-5/6 h-3" />
      <SkeletonLine className="w-2/3 h-3" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
      <SkeletonLine className="w-24 h-3" />
      <SkeletonLine className="w-20 h-4" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="grid grid-cols-5 gap-4 px-6 py-5 border-b border-gray-50 animate-pulse">
    <div className="col-span-2 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-gray-100" />
      <div className="space-y-2 flex-1">
        <SkeletonLine className="w-2/3 h-4" />
        <SkeletonLine className="w-1/3 h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLine className="w-3/4 h-4" />
      <SkeletonLine className="w-1/2 h-3" />
    </div>
    <div className="space-y-2">
      <SkeletonLine className="w-24 h-6" />
      <SkeletonLine className="w-28 h-3" />
    </div>
    <div className="flex justify-end gap-2">
      <SkeletonLine className="w-20 h-9 rounded-lg" />
      <SkeletonLine className="w-24 h-9 rounded-lg" />
    </div>
  </div>
);

export const SkeletonDashboardCard = ({ dark = false }) => (
  <div className={`rounded-2xl p-6 shadow-sm animate-pulse ${dark ? "bg-emerald-800" : "bg-white border border-gray-100"}`}>
    <SkeletonLine className={`w-24 h-3 mb-5 ${dark ? "bg-emerald-700" : "bg-gray-100"}`} />
    <SkeletonLine className={`w-20 h-12 ${dark ? "bg-emerald-700" : "bg-gray-100"}`} />
  </div>
);
