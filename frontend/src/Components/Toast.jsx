const Toast = ({ type = "info", message }) => {
  if (!message) {
    return null;
  }

  const toneClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-slate-200 bg-slate-50 text-slate-900",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClasses[type] || toneClasses.info}`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default Toast;
