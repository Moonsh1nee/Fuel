import pino from "pino";

/**
 * Single shared logger for server-side error reporting. Pretty-printed in
 * dev (pino-pretty), plain NDJSON in production - there's no log shipper
 * configured for this local-only app, so NDJSON just keeps stdout parseable
 * if one gets added later.
 */
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
});
