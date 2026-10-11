function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-slate-200/70 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
