import logoMark from "@/assets/logo-mark.png";

export function Logo({ size = 36, showText = true, tagline = false, className = "" }: {
  size?: number; showText?: boolean; tagline?: boolean; className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoMark} alt="LogiBack Earn" width={size} height={size}
        className="rounded-xl shadow-glow shrink-0"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className="leading-tight">
          <p className="font-extrabold text-[15px] tracking-tight">
            Logi<span className="text-gradient-gold">Back Earn</span>
          </p>
          {tagline && (
            <p className="text-[10px] text-muted-foreground tracking-wide">Kenya's Trusted Review Platform</p>
          )}
        </div>
      )}
    </div>
  );
}
