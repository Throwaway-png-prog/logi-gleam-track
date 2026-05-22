export function formatKsh(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `KSh ${v.toLocaleString("en-KE")}`;
}

/** Display a phone number in Kenyan format: 0712 345 678 */
export function formatPhoneKE(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) digits = "0" + digits.slice(3);
  if (digits.length === 9 && !digits.startsWith("0")) digits = "0" + digits;
  if (digits.length !== 10) return raw;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function maskPhone(raw: string | null | undefined): string {
  const f = formatPhoneKE(raw);
  if (!f) return "";
  // 0712 345 678 -> 0712 ••• 678
  return f.replace(/(\d{4}) (\d{3}) (\d{3})/, "$1 ••• $3");
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "W";
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "W";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Deterministic vivid color from a string (for avatar backgrounds). */
export function colorFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 60% 35%)`;
}
