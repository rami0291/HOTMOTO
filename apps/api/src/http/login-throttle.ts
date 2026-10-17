// Password sign-in attempts. Only wrong passwords count, for 15 minutes. A browser that has signed in
// before (its device cookie, admin/auth.ts) is held to its own budget alone, so guesses from elsewhere
// can never lock the admin out of it. Every other attempt is held to its network's budget and to one
// shared budget, which also stops guesses spread over many addresses. An IPv6 client is counted by its
// /64, which one subscriber usually holds whole. A blocked attempt is not tried and not counted, so in
// any 15 minutes at most the shared budget's networks are added; the table cannot be flooded.
import { isIPv6 } from "node:net";

const WINDOW_MS = 15 * 60_000;
export const LIMITS = { device: 10, network: 10, shared: 50 } as const;
/** Past this many budgets, the expired ones are dropped. */
const MAX_KEYS = 1000;

/** The address an attempt is counted under: an IPv4 address, or an IPv6 address's /64. */
export function networkOf(ip: string): string {
  const v4 = /^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (v4) return v4[1]!;
  if (!isIPv6(ip)) return ip;
  const [head = "", tail] = ip.toLowerCase().replace(/%.*$/, "").split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = tail === undefined ? h : [...h, ...Array<string>(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}

export class LoginThrottle {
  private readonly failures = new Map<string, number[]>();
  private shared: number[] = [];
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  private recent(list: number[] | undefined): number[] {
    const since = this.now() - WINDOW_MS;
    return (list ?? []).filter((t) => t > since);
  }

  /** Whether this attempt must wait: a known browser for its own budget, anyone else for theirs or the shared one. */
  blocked(ip: string, device: string | null): boolean {
    if (device) return this.recent(this.failures.get(`device:${device}`)).length >= LIMITS.device;
    return this.recent(this.failures.get(`net:${networkOf(ip)}`)).length >= LIMITS.network || this.recent(this.shared).length >= LIMITS.shared;
  }

  /** Counts a wrong password. */
  fail(ip: string, device: string | null): void {
    const now = this.now();
    if (!device) this.shared = [...this.recent(this.shared), now];
    const key = device ? `device:${device}` : `net:${networkOf(ip)}`;
    this.failures.set(key, [...this.recent(this.failures.get(key)), now]);
    if (this.failures.size > MAX_KEYS) for (const [k, list] of this.failures) if (this.recent(list).length === 0) this.failures.delete(k);
  }
}
