import PropTypes from "prop-types";

const SkeletonLine = ({ className = "" }) => (
  <div className={`rounded-full bg-[#e5e5e5] ${className}`} />
);
SkeletonLine.propTypes = {
  className: PropTypes.string,
};

export const SkeletonCard = () => (
  <div className="rounded-[14px] border border-[#e5e5e5] bg-white p-5 shadow-[0_0_0_1px_rgba(10,10,10,0.08)] animate-pulse">
    <div className="flex items-start justify-between mb-5">
      <div className="w-14 h-14 bg-[#f2f2f2] rounded-[10px] border border-[#e5e5e5]" />
      <SkeletonLine className="w-20 h-6" />
    </div>
    <SkeletonLine className="w-3/4 h-5 mb-3" />
    <SkeletonLine className="w-1/2 h-4 mb-5" />
    <div className="space-y-2.5 mb-6">
      <SkeletonLine className="w-full h-3" />
      <SkeletonLine className="w-5/6 h-3" />
      <SkeletonLine className="w-2/3 h-3" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-[#e5e5e5]">
      <SkeletonLine className="w-24 h-3" />
      <SkeletonLine className="w-20 h-4" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="grid grid-cols-5 gap-4 px-6 py-5 border-b border-[#e5e5e5] animate-pulse">
    <div className="col-span-2 flex items-center gap-4">
      <div className="w-12 h-12 rounded-[10px] bg-[#f2f2f2] border border-[#e5e5e5]" />
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
  <div className={`rounded-[14px] p-5 animate-pulse ${dark ? "bg-black" : "bg-white border border-[#e5e5e5] shadow-[0_0_0_1px_rgba(10,10,10,0.08)]"}`}>
    <SkeletonLine className={`w-24 h-3 mb-5 ${dark ? "bg-white/25" : "bg-[#e5e5e5]"}`} />
    <SkeletonLine className={`w-20 h-12 ${dark ? "bg-white/25" : "bg-[#e5e5e5]"}`} />
  </div>
);

SkeletonDashboardCard.propTypes = {
  dark: PropTypes.bool,
};
