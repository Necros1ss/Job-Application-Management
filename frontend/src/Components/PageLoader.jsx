/* eslint-disable react/prop-types */
const PageLoader = ({ label = "Checking session..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-white px-6">
    <div className="flex flex-col items-center text-center">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#e5e5e5]" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
      <p className="mt-5 text-sm font-semibold text-[#0a0a0a]">{label}</p>
      <p className="mt-1 text-xs text-[#737373]">Restoring your workspace securely.</p>
    </div>
  </div>
);

export default PageLoader;
