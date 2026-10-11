import { Loader2 } from "lucide-react";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

const variantStyles = {
  primary:
    "bg-linear-to-r from-primary to-secondary text-white shadow-sm shadow-secondary/25 hover:from-primary hover:to-primary hover:shadow-md hover:shadow-secondary/30 active:from-primary active:to-primary",
  secondary:
    "border border-border bg-surface text-primary hover:border-secondary/40 hover:bg-lavender active:bg-violet",
};

function Button({
  children,
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${
        variantStyles[variant] ?? variantStyles.primary
      } px-5 py-2.5 text-sm ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export default Button;
