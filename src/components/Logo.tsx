import logoMark from "@/assets/logo-mark.png";

export function Logo({ size = 36, showText = true, tagline = false, className = "" }: {
  size?: number; showText?: boolean; tagline?: boolean; className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoMark} alt="LogiBack International" width={size} height={size}
        className="rounded-xl shadow-glow shrink-0"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className="leading-tight">
          <p className="font-extrabold text-[15px] tracking-tight flex items-center gap-1">
            Logi<span className="text-gradient-gold">Back</span>
            <span className="text-[10px] font-bold text-muted-foreground ml-1">Int'l</span>
          </p>
          {tagline && (
            <p className="text-[10px] text-muted-foreground tracking-wide flex items-center gap-1">
              <span aria-hidden>🇬🇧</span> London HQ · <span aria-hidden>🇰🇪</span> Nairobi Branch
            </p>
          )}
        </div>
      )}
    </div>
  );
}
