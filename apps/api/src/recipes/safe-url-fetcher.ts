import { lookup as dnsLookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export const RECIPE_PAGE_MAX_BYTES = 1_000_000;
export const RECIPE_FETCH_TIMEOUT_MS = 8_000;
export const RECIPE_MAX_REDIRECTS = 3;

export class SafeFetchError extends Error {
  constructor(public readonly publicCode: string) { super(publicCode); }
}

type LookupAddress = { address: string; family: number };
type Resolver = (hostname: string) => Promise<LookupAddress[]>;
type RawResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: Buffer };
type Requester = (url: URL, address: LookupAddress, maxBytes: number, timeoutMs: number) => Promise<RawResponse>;
export type SafeFetcherDependencies = { resolve?: Resolver; request?: Requester };

function ipv4Number(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]) >>> 0;
}

function inV4Range(value: number, base: string, bits: number) {
  const baseValue = ipv4Number(base)!;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (baseValue & mask);
}

const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]
];

function ipv6BigInt(address: string): bigint | null {
  const zoneFree = address.split("%")[0].toLowerCase();
  const mapped = zoneFree.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  let normalized = zoneFree;
  if (mapped) {
    const v4 = ipv4Number(mapped[2]);
    if (v4 == null) return null;
    normalized = `${mapped[1]}${((v4 >>> 16) & 0xffff).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;
  const parts = [...left, ...Array(missing).fill("0"), ...right];
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  return parts.reduce((value, part) => (value << 16n) + BigInt(parseInt(part, 16)), 0n);
}

function inV6Range(value: bigint, base: string, bits: number) {
  const baseValue = ipv6BigInt(base)!;
  const shift = BigInt(128 - bits);
  return (value >> shift) === (baseValue >> shift);
}

export function isPublicAddress(address: string) {
  const family = net.isIP(address);
  if (family === 4) {
    const value = ipv4Number(address)!;
    return !BLOCKED_V4.some(([base, bits]) => inV4Range(value, base, bits));
  }
  if (family === 6) {
    const value = ipv6BigInt(address);
    if (value == null) return false;
    const mappedPrefix = ipv6BigInt("::ffff:0:0")!;
    if ((value >> 32n) === (mappedPrefix >> 32n)) return isPublicAddress(`${Number((value >> 24n) & 255n)}.${Number((value >> 16n) & 255n)}.${Number((value >> 8n) & 255n)}.${Number(value & 255n)}`);
    return ![
      ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
      ["2001:db8::", 32], ["2001:2::", 48], ["2001:10::", 28]
    ].some(([base, bits]) => inV6Range(value, String(base), Number(bits)));
  }
  return false;
}

async function resolvePublic(hostname: string, resolver: Resolver) {
  const normalizedHostname = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  if (normalizedHostname.toLowerCase() === "localhost") throw new SafeFetchError("blocked_url");
  const literalFamily = net.isIP(normalizedHostname);
  const addresses = literalFamily ? [{ address: normalizedHostname, family: literalFamily }] : await resolver(normalizedHostname).catch(() => { throw new SafeFetchError("dns_failure"); });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new SafeFetchError("blocked_url");
  return addresses[0];
}

const defaultResolver: Resolver = (hostname) => dnsLookup(hostname, { all: true, verbatim: true });

const defaultRequester: Requester = (url, address, maxBytes, timeoutMs) => new Promise((resolve, reject) => {
  const client = url.protocol === "https:" ? https : http;
  const request = client.request(url, {
    method: "GET",
    headers: { Accept: "text/html,application/xhtml+xml;q=0.9", "User-Agent": "KetoMentorRecipeImporter/1.0" },
    lookup: (_hostname, _options, callback) => callback(null, address.address, address.family as 4 | 6)
  }, (response) => {
    const headers = response.headers;
    const declared = Number(headers["content-length"]);
    if (Number.isFinite(declared) && declared > maxBytes) { response.destroy(); return reject(new SafeFetchError("response_too_large")); }
    const chunks: Buffer[] = [];
    let bytes = 0;
    response.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maxBytes) { response.destroy(new SafeFetchError("response_too_large")); return; }
      chunks.push(Buffer.from(chunk));
    });
    response.on("end", () => resolve({ status: response.statusCode ?? 0, headers, body: Buffer.concat(chunks) }));
    response.on("error", reject);
  });
  request.setTimeout(timeoutMs, () => request.destroy(new SafeFetchError("fetch_timeout")));
  request.on("error", (error) => reject(error instanceof SafeFetchError ? error : new SafeFetchError("fetch_failed")));
  request.end();
});

export async function fetchPublicHtml(rawUrl: string, dependencies: SafeFetcherDependencies = {}) {
  const resolver = dependencies.resolve ?? defaultResolver;
  const requester = dependencies.request ?? defaultRequester;
  let current: URL;
  try { current = new URL(rawUrl); } catch { throw new SafeFetchError("invalid_url"); }

  for (let redirect = 0; redirect <= RECIPE_MAX_REDIRECTS; redirect += 1) {
    if (!['http:', 'https:'].includes(current.protocol) || current.username || current.password) throw new SafeFetchError("invalid_url");
    const address = await resolvePublic(current.hostname, resolver);
    const response = await requester(current, address, RECIPE_PAGE_MAX_BYTES, RECIPE_FETCH_TIMEOUT_MS);
    const declaredLength = Number(response.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > RECIPE_PAGE_MAX_BYTES) throw new SafeFetchError("response_too_large");
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = Array.isArray(response.headers.location) ? response.headers.location[0] : response.headers.location;
      if (!location) throw new SafeFetchError("fetch_failed");
      if (redirect === RECIPE_MAX_REDIRECTS) throw new SafeFetchError("redirect_limit");
      try { current = new URL(location, current); } catch { throw new SafeFetchError("invalid_url"); }
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new SafeFetchError("fetch_failed");
    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.startsWith("text/html") && !contentType.startsWith("application/xhtml+xml")) throw new SafeFetchError("unsupported_content_type");
    if (response.body.length > RECIPE_PAGE_MAX_BYTES) throw new SafeFetchError("response_too_large");
    return { html: response.body.toString("utf8"), finalUrl: current.toString() };
  }
  throw new SafeFetchError("redirect_limit");
}
