/**
 * Cloudflare Pages Function: Dynamic CORS for Module Federation remote assets (/assets/*)
 *
 * Protects compiled JavaScript bundles and exposed microfrontends from unauthorized
 * cross-origin resource abuse in production while permitting:
 * 1. Same-origin requests (Rose standalone app)
 * 2. Local development origins (http/https on localhost or 127.0.0.1 on any port)
 * 3. Cloudflare Pages preview domains (*.pages.dev)
 * 4. Specific authorized domains via the ALLOWED_ORIGINS environment variable
 */

export interface Env {
  ALLOWED_ORIGINS?: string;
}

export interface EventContext<
  Environment,
  ParamKey extends string = string,
  Data = Record<string, unknown>,
> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Environment;
  params: Record<ParamKey, string | string[]>;
  data: Data;
}

export type PagesFunction<
  Environment = unknown,
  ParamKey extends string = string,
  Data = Record<string, unknown>,
> = (context: EventContext<Environment, ParamKey, Data>) => Response | Promise<Response>;

/**
 * Checks whether an origin is allowed to access Rose's federated assets.
 */
export function isAllowedOrigin(
  origin: string,
  requestUrl: string,
  allowedOriginsEnv?: string,
): boolean {
  if (!origin) {
    return false;
  }

  // 1. Same-origin is always allowed
  try {
    const selfOrigin = new URL(requestUrl).origin;
    if (origin.toLowerCase() === selfOrigin.toLowerCase()) {
      return true;
    }
  } catch {
    // Ignore URL parse errors
  }

  // 2. Local development origins (localhost / 127.0.0.1 on any port, http or https)
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) {
    return true;
  }

  // 3. Cloudflare Pages domains (e.g. https://any-preview-branch.pages.dev)
  if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) {
    return true;
  }

  // 4. Custom allowed origins from environment variable
  if (allowedOriginsEnv) {
    const list = allowedOriginsEnv
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    for (const pattern of list) {
      if (pattern === "*") {
        return true;
      }
      if (pattern.toLowerCase() === origin.toLowerCase()) {
        return true;
      }

      // Handle wildcard subdomains like https://*.example.com or *.example.com
      if (pattern.includes("*")) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, String.raw`\$&`).replace(/\*/g, ".*");
        const regexPattern = `^${escaped}$`;
        const regex = new RegExp(regexPattern, "i");
        if (regex.test(origin)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Main request handler for all /assets/* requests on Cloudflare Pages.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get("Origin");

  // Non-CORS direct request (e.g. direct asset loading without Origin header)
  if (!origin) {
    return context.next();
  }

  const allowed = isAllowedOrigin(origin, request.url, env?.ALLOWED_ORIGINS);

  // Preflight check
  if (request.method === "OPTIONS") {
    if (allowed) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Range, X-Requested-With",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    return new Response("Forbidden: Origin not allowed", { status: 403 });
  }

  // Reject unauthorized cross-origin requests to prevent resource leeching
  if (!allowed) {
    return new Response("Forbidden: Origin not allowed", {
      status: 403,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  // Fetch the static asset from Cloudflare Pages static store
  const response = await context.next();

  // Attach CORS headers
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range");
  headers.append("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
