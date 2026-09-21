/** Contact validation shared by the finder gate and the counselling form.
 *  Format checks only — this confirms an address is well-formed, never that
 *  it belongs to the person typing it. Verification needs a code or a link. */

export interface Check { ok: boolean; value?: string; msg?: string; fix?: string }

export interface Dial { c: string; n: string; d: string; min: number; max: number; ex: string }

export const DIALS: Dial[] = [
  { c: "IN", n: "India", d: "+91", min: 10, max: 10, ex: "98765 43210" },
  { c: "LK", n: "Sri Lanka", d: "+94", min: 9, max: 9, ex: "71 234 5678" },
  { c: "SG", n: "Singapore", d: "+65", min: 8, max: 8, ex: "8123 4567" },
  { c: "MY", n: "Malaysia", d: "+60", min: 9, max: 10, ex: "12 345 6789" },
  { c: "AE", n: "United Arab Emirates", d: "+971", min: 9, max: 9, ex: "50 123 4567" },
  { c: "GB", n: "United Kingdom", d: "+44", min: 10, max: 10, ex: "7700 900123" },
  { c: "US", n: "United States", d: "+1", min: 10, max: 10, ex: "415 555 0132" },
  { c: "CA", n: "Canada", d: "+1", min: 10, max: 10, ex: "416 555 0132" },
  { c: "AU", n: "Australia", d: "+61", min: 9, max: 9, ex: "412 345 678" },
  { c: "PH", n: "Philippines", d: "+63", min: 10, max: 10, ex: "917 123 4567" },
  { c: "HK", n: "Hong Kong", d: "+852", min: 8, max: 8, ex: "5123 4567" },
  { c: "JP", n: "Japan", d: "+81", min: 10, max: 10, ex: "90 1234 5678" },
  { c: "CN", n: "China", d: "+86", min: 11, max: 11, ex: "131 2345 6789" },
  { c: "KR", n: "South Korea", d: "+82", min: 9, max: 10, ex: "10 1234 5678" },
  { c: "TW", n: "Taiwan", d: "+886", min: 9, max: 9, ex: "912 345 678" },
  { c: "ZA", n: "South Africa", d: "+27", min: 9, max: 9, ex: "82 123 4567" },
  { c: "XX", n: "Somewhere else", d: "+", min: 7, max: 15, ex: "country code and number" },
];

const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com",
  "gmail.con": "gmail.com", "gnail.com": "gmail.com", "hotmial.com": "hotmail.com",
  "yahooo.com": "yahoo.com", "yaho.com": "yahoo.com", "outlok.com": "outlook.com",
};

export function validName(raw: string): Check {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return { ok: false, msg: "Tell us your name." };
  if (t.length < 2) return { ok: false, msg: "That looks too short to be a name." };
  if (/\d/.test(t)) return { ok: false, msg: "Names do not contain numbers." };
  if (!/\p{L}/u.test(t)) return { ok: false, msg: "Use letters for your name." };
  if (/(.)\1{3,}/.test(t)) return { ok: false, msg: "That does not look like a real name." };
  if (!/^[\p{L}\p{M}'’.\- ]+$/u.test(t)) return { ok: false, msg: "Letters, spaces, hyphens and apostrophes only." };
  return { ok: true, value: t };
}

export function validEmail(raw: string): Check {
  const t = raw.trim().toLowerCase();
  if (!t) return { ok: false, msg: "We need an email address to reach you on." };
  if (/\s/.test(t)) return { ok: false, msg: "An email address cannot contain spaces." };
  const parts = t.split("@");
  if (parts.length !== 2) return { ok: false, msg: "An email address needs exactly one @." };
  const [local, domain] = parts;
  if (!local || local.length > 64) return { ok: false, msg: "Check the part before the @." };
  if (/^\.|\.$|\.\./.test(local)) return { ok: false, msg: "Check the dots before the @." };
  if (!/^[a-z0-9!#$%&'*+/=?^_`{|}~.\-]+$/.test(local)) return { ok: false, msg: "That has a character an email cannot contain." };
  if (!domain.includes(".")) return { ok: false, msg: "The domain needs a dot — like example.com." };
  if (/^\.|\.$|\.\.|^-|-$/.test(domain) || !/^[a-z0-9.\-]+$/.test(domain)) return { ok: false, msg: "Check the domain." };
  if (!/^[a-z]{2,}$/.test(domain.split(".").pop()!)) return { ok: false, msg: "That domain ending does not look right." };
  if (TYPOS[domain]) {
    const fixed = `${local}@${TYPOS[domain]}`;
    return { ok: false, msg: `Did you mean ${fixed}?`, fix: fixed };
  }
  return { ok: true, value: t };
}

export function validPhone(country: string, raw: string): Check {
  const cfg = DIALS.find((d) => d.c === country) ?? DIALS[DIALS.length - 1];
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return { ok: false, msg: "We need a number we can reach you on." };

  let d = digitsOnly;
  const cc = cfg.d.replace("+", "");
  // people paste the dial code or a trunk zero back in — strip both
  if (cc && d.startsWith(cc) && d.length > cfg.max) d = d.slice(cc.length);
  if (d.length > cfg.min && d.startsWith("0")) d = d.replace(/^0+/, "");

  const range = cfg.min === cfg.max ? `${cfg.min}` : `${cfg.min}–${cfg.max}`;
  if (d.length < cfg.min) return { ok: false, msg: `Too short — ${cfg.n} numbers have ${range} digits.` };
  if (d.length > cfg.max) return { ok: false, msg: `Too long — ${cfg.n} numbers have ${range} digits.` };
  if (/^(\d)\1+$/.test(d)) return { ok: false, msg: "That is not a real number." };
  if ((country === "US" || country === "CA") && /^[01]/.test(d)) return { ok: false, msg: "An area code cannot start with 0 or 1." };
  if (country === "IN" && !/^[6-9]/.test(d)) return { ok: false, msg: "Indian mobile numbers start with 6, 7, 8 or 9." };

  return { ok: true, value: (cfg.d === "+" ? "+" : cfg.d) + d };
}
