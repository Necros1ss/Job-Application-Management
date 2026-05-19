import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div className="max-w-3xl w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
      <div className="mx-auto mb-8 w-full max-w-sm">
        <svg viewBox="0 0 420 260" role="img" aria-label="Lost page illustration" className="w-full h-auto">
          <rect x="52" y="36" width="316" height="188" rx="28" fill="#ECFDF5" />
          <circle cx="130" cy="98" r="28" fill="#10B981" opacity="0.18" />
          <circle cx="292" cy="154" r="46" fill="#059669" opacity="0.14" />
          <path d="M104 169c34-42 68-42 102 0s68 42 102 0" fill="none" stroke="#059669" strokeWidth="10" strokeLinecap="round" />
          <rect x="142" y="70" width="136" height="96" rx="16" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="4" />
          <path d="M174 119h72M174 143h48" stroke="#6B7280" strokeWidth="8" strokeLinecap="round" />
          <path d="M185 94h50" stroke="#059669" strokeWidth="8" strokeLinecap="round" />
          <circle cx="312" cy="78" r="14" fill="#10B981" />
          <path d="M305 78h14M312 71v14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 mb-3">Error 404</p>
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">404 – Page Not Found</h1>
      <p className="text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
        The page you are looking for may have moved, expired, or never existed.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
