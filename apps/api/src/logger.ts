import pino from "pino";

// Request/response headers that carry live session or provider credentials and must
// never reach persisted logs, regardless of log level or destination.
export const LOG_REDACT_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  'res.headers["set-cookie"]'
];

export function createLogger(level: string, destination?: NodeJS.WritableStream) {
  const options = { level, redact: { paths: LOG_REDACT_PATHS, censor: "[Redacted]" } };
  return destination ? pino(options, destination) : pino(options);
}
