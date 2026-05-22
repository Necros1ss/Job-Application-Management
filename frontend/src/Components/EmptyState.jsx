/* eslint-disable react/prop-types */
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    {Icon && (
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#f2f2f2] text-[#0a0a0a]">
        <Icon size={22} />
      </div>
    )}
    <h3 className="text-base font-semibold text-[#0a0a0a]">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm leading-6 text-[#737373]">{description}</p>}
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center justify-center rounded-[10px] bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0a0a0a]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
