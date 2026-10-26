import { describe, expect, it, vi } from "vitest";
import { isAllowedOrigin, onRequest } from "../../../functions/assets/[[path]]";

describe("Cloudflare Pages Function: assets CORS", () => {
  describe("isAllowedOrigin", () => {
    const selfUrl = "https://rosejournal.pages.dev/assets/remoteEntry.js";

    it("returns false for missing or empty origin", () => {
      expect(isAllowedOrigin("", selfUrl)).toBeFalsy();
    });

    it("allows same-origin requests", () => {
      expect(isAllowedOrigin("https://rosejournal.pages.dev", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("https://custom-rose.com", "https://custom-rose.com/assets/index.js")).toBeTruthy();
    });

    it("allows local development origins on any port", () => {
      expect(isAllowedOrigin("http://localhost:5173", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("http://localhost:5174", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("https://localhost:4176", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("http://127.0.0.1:3000", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("http://localhost", selfUrl)).toBeTruthy();
    });

    it("allows Cloudflare Pages domains (*.pages.dev)", () => {
      expect(isAllowedOrigin("https://sibling-app.pages.dev", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("https://preview-123.pages.dev", selfUrl)).toBeTruthy();
      expect(isAllowedOrigin("http://insecure.pages.dev", selfUrl)).toBeFalsy(); // must be https
    });

    it("rejects unauthorized external origins by default", () => {
      expect(isAllowedOrigin("https://evil-leech.com", selfUrl)).toBeFalsy();
      expect(isAllowedOrigin("https://attacker.org", selfUrl)).toBeFalsy();
    });

    it("allows origins specified in ALLOWED_ORIGINS env variable", () => {
      const allowedEnv = "https://app.custom.com, https://dashboard.io";
      expect(isAllowedOrigin("https://app.custom.com", selfUrl, allowedEnv)).toBeTruthy();
      expect(isAllowedOrigin("https://dashboard.io", selfUrl, allowedEnv)).toBeTruthy();
      expect(isAllowedOrigin("https://other.com", selfUrl, allowedEnv)).toBeFalsy();
    });

    it("supports wildcards in ALLOWED_ORIGINS", () => {
      const wildcardEnv = "https://*.mycompany.com";
      expect(isAllowedOrigin("https://app.mycompany.com", selfUrl, wildcardEnv)).toBeTruthy();
      expect(isAllowedOrigin("https://staging.mycompany.com", selfUrl, wildcardEnv)).toBeTruthy();
      expect(isAllowedOrigin("https://othercompany.com", selfUrl, wildcardEnv)).toBeFalsy();
    });
  });

  describe("onRequest handler", () => {
    function makeContext(options: {
      method?: string;
      origin?: string | null;
      url?: string;
      allowedOrigins?: string;
      nextResponse?: Response;
    }) {
      const method = options.method || "GET";
      const headers = new Headers();
      if (options.origin) {
        headers.set("Origin", options.origin);
      }

      const request = new Request(options.url || "https://rosejournal.pages.dev/assets/remoteEntry.js", {
        method,
        headers,
      });

      const next = vi.fn<() => Promise<Response>>(async () => (
        options.nextResponse ||
        new Response("console.log('remote module');", {
          status: 200,
          headers: { "Content-Type": "application/javascript" },
        })
      ));

      return {
        context: {
          request,
          functionPath: "/assets/remoteEntry.js",
          waitUntil: vi.fn<(promise: Promise<unknown>) => void>(),
          next,
          env: {
            ALLOWED_ORIGINS: options.allowedOrigins,
          },
          params: { path: ["remoteEntry.js"] },
          data: {},
        },
        next,
      };
    }

    it("bypasses CORS processing for non-CORS requests (no Origin header)", async () => {
      const { context, next } = makeContext({ origin: null });
      const res = await onRequest(context);

      expect(next).toHaveBeenCalled();
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("handles preflight OPTIONS requests for allowed origin", async () => {
      const { context, next } = makeContext({
        method: "OPTIONS",
        origin: "http://localhost:5173",
      });
      const res = await onRequest(context);

      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects preflight OPTIONS requests for unauthorized origin with 403", async () => {
      const { context, next } = makeContext({
        method: "OPTIONS",
        origin: "https://unauthorized-domain.com",
      });
      const res = await onRequest(context);

      expect(res.status).toBe(403);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it("blocks GET requests from unauthorized origins with 403 without serving asset", async () => {
      const { context, next } = makeContext({
        method: "GET",
        origin: "https://bandwidth-leech.com",
      });
      const res = await onRequest(context);

      expect(res.status).toBe(403);
      expect(await res.text()).toContain("Forbidden");
      expect(next).not.toHaveBeenCalled();
    });

    it("serves GET requests for authorized origin and appends CORS headers", async () => {
      const { context, next } = makeContext({
        method: "GET",
        origin: "https://my-host-app.pages.dev",
      });
      const res = await onRequest(context);

      expect(res.status).toBe(200);
      expect(next).toHaveBeenCalled();
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://my-host-app.pages.dev");
      expect(res.headers.get("Vary")).toContain("Origin");
      expect(await res.text()).toBe("console.log('remote module');");
    });
  });
});
