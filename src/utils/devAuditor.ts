/**
 * In-Browser Dev Auditor for SEO, Accessibility, Best Practices, and Performance.
 * Automatically runs on route changes in development mode (import.meta.env.DEV).
 * Zero external dependencies. Zero overhead in production builds.
 */

interface MetricDetail {
  category: "Performance" | "Accessibility" | "Best Practices" | "SEO";
  metric: string;
  scoreImpact: string;
  status: "Pass" | "Warning" | "Fail";
  details: string;
  elements?: Element[];
}

export function auditCurrentPage(routePath: string): void {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return;
  }

  // Small delay to allow the Vue view to mount and populate content
  setTimeout(() => {
    runAudit(routePath);
  }, 250);
}

function getRating(score: number): "Good" | "Needs Improvement" | "Poor" {
  if (score >= 90) {
    return "Good";
  }
  if (score >= 50) {
    return "Needs Improvement";
  }
  return "Poor";
}

function runAudit(routePath: string): void {
  const details: MetricDetail[] = [];

  // ==========================================
  // 1. PERFORMANCE (0-100)
  // ==========================================
  let perfScore = 100;
  const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

  let ttfb = 50;
  let domReady = 200;
  if (navEntry) {
    ttfb = Math.max(0, Math.round(navEntry.responseStart - navEntry.requestStart));
    domReady = Math.max(0, Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime));
  }

  // TTFB Scoring (max 35 pts)
  if (ttfb > 600) {
    perfScore -= 20;
    details.push({
      category: "Performance",
      details: `${ttfb} ms (Slow: should be < 200ms)`,
      metric: "Server TTFB",
      scoreImpact: "-20",
      status: "Fail",
    });
  } else if (ttfb > 250) {
    perfScore -= 10;
    details.push({
      category: "Performance",
      details: `${ttfb} ms (Moderate: target < 200ms)`,
      metric: "Server TTFB",
      scoreImpact: "-10",
      status: "Warning",
    });
  } else {
    details.push({
      category: "Performance",
      details: `${ttfb} ms (Fast)`,
      metric: "Server TTFB",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  // DOM Content Loaded (max 35 pts)
  if (domReady > 2000) {
    perfScore -= 20;
    details.push({
      category: "Performance",
      details: `${domReady} ms (Slow)`,
      metric: "DOM Content Loaded",
      scoreImpact: "-20",
      status: "Fail",
    });
  } else if (domReady > 1000) {
    perfScore -= 10;
    details.push({
      category: "Performance",
      details: `${domReady} ms`,
      metric: "DOM Content Loaded",
      scoreImpact: "-10",
      status: "Warning",
    });
  } else {
    details.push({
      category: "Performance",
      details: `${domReady} ms (Optimal)`,
      metric: "DOM Content Loaded",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  // First Contentful Paint (max 30 pts)
  const paintEntries = performance.getEntriesByType("paint");
  const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
  // If the browser tab was opened in the background or left idle, Chromium delays the paint metric until focus.
  let fcpMs = fcpEntry ? Math.round(fcpEntry.startTime) : domReady;
  if (fcpMs > 10000 && domReady < 2000) {
    fcpMs = domReady;
  }

  if (fcpMs > 2500) {
    perfScore -= 15;
    details.push({
      category: "Performance",
      details: `${fcpMs} ms (High)`,
      metric: "First Contentful Paint",
      scoreImpact: "-15",
      status: "Fail",
    });
  } else if (fcpMs > 1500) {
    perfScore -= 5;
    details.push({
      category: "Performance",
      details: `${fcpMs} ms`,
      metric: "First Contentful Paint",
      scoreImpact: "-5",
      status: "Warning",
    });
  } else {
    details.push({
      category: "Performance",
      details: `${fcpMs} ms (Good)`,
      metric: "First Contentful Paint",
      scoreImpact: "0",
      status: "Pass",
    });
  }
  perfScore = Math.max(0, Math.min(100, perfScore));

  // ==========================================
  // 2. ACCESSIBILITY (0-100)
  // ==========================================
  let a11yScore = 100;

  // Main Landmark
  const main = document.querySelector("main#main-content");
  if (!main) {
    a11yScore -= 20;
    details.push({
      category: "Accessibility",
      details: 'Missing <main id="main-content">',
      metric: "Main Landmark",
      scoreImpact: "-20",
      status: "Fail",
    });
  } else {
    details.push({
      category: "Accessibility",
      details: '<main id="main-content"> present',
      metric: "Main Landmark",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  // Heading Outline
  const h1s = Array.from(document.querySelectorAll("h1"));
  if (h1s.length === 1) {
    details.push({
      category: "Accessibility",
      details: `1 valid <h1> ("${h1s[0]?.textContent?.trim().slice(0, 30) || "empty"}")`,
      metric: "Heading Outline",
      scoreImpact: "0",
      status: "Pass",
    });
  } else if (h1s.length === 0) {
    a11yScore -= 15;
    details.push({
      category: "Accessibility",
      details: "No <h1> heading on page",
      metric: "Heading Outline",
      scoreImpact: "-15",
      status: "Warning",
    });
  } else {
    a11yScore -= 15;
    details.push({
      category: "Accessibility",
      details: `${h1s.length} duplicate <h1> tags found`,
      elements: h1s,
      metric: "Heading Outline",
      scoreImpact: "-15",
      status: "Fail",
    });
  }

  // Image Alt Attributes
  const images = Array.from(document.querySelectorAll("img"));
  const missingAltImgs = images.filter((img) => !img.hasAttribute("alt"));
  const genericAltImgs = images.filter((img) => img.getAttribute("alt")?.toLowerCase() === "image");

  if (missingAltImgs.length > 0) {
    const penalty = Math.min(25, missingAltImgs.length * 10);
    a11yScore -= penalty;
    details.push({
      category: "Accessibility",
      details: `${missingAltImgs.length} images missing alt attribute`,
      elements: missingAltImgs,
      metric: "Image Alt Text",
      scoreImpact: `-${penalty}`,
      status: "Fail",
    });
  } else if (genericAltImgs.length > 0) {
    const penalty = Math.min(10, genericAltImgs.length * 5);
    a11yScore -= penalty;
    details.push({
      category: "Accessibility",
      details: `${genericAltImgs.length} images use generic alt="Image"`,
      elements: genericAltImgs,
      metric: "Image Alt Text",
      scoreImpact: `-${penalty}`,
      status: "Warning",
    });
  } else {
    details.push({
      category: "Accessibility",
      details: `All ${images.length} images have compliant alt tags`,
      metric: "Image Alt Text",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  // Button Accessible Names
  const buttons = Array.from(document.querySelectorAll("button"));
  const unlabelledButtons = buttons.filter((btn) => {
    const ariaLabel = btn.getAttribute("aria-label")?.trim();
    const titleAttr = btn.getAttribute("title")?.trim();
    const text = btn.textContent?.trim();
    return !ariaLabel && !titleAttr && !text;
  });

  if (unlabelledButtons.length > 0) {
    const penalty = Math.min(25, unlabelledButtons.length * 10);
    a11yScore -= penalty;
    details.push({
      category: "Accessibility",
      details: `${unlabelledButtons.length} buttons missing accessible names`,
      elements: unlabelledButtons,
      metric: "Button Accessible Names",
      scoreImpact: `-${penalty}`,
      status: "Fail",
    });
  } else {
    details.push({
      category: "Accessibility",
      details: `All ${buttons.length} buttons labelled`,
      metric: "Button Accessible Names",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  // Input Labels
  const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
  const unlabelledInputs = inputs.filter((el) => {
    const id = el.getAttribute("id");
    const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
    const hasAria = Boolean(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"));
    return !hasLabel && !hasAria;
  });

  if (unlabelledInputs.length > 0) {
    const penalty = Math.min(20, unlabelledInputs.length * 10);
    a11yScore -= penalty;
    details.push({
      category: "Accessibility",
      details: `${unlabelledInputs.length} inputs missing <label> or aria-label`,
      elements: unlabelledInputs,
      metric: "Form Control Labels",
      scoreImpact: `-${penalty}`,
      status: "Warning",
    });
  } else if (inputs.length > 0) {
    details.push({
      category: "Accessibility",
      details: `All ${inputs.length} form controls labelled`,
      metric: "Form Control Labels",
      scoreImpact: "0",
      status: "Pass",
    });
  }
  a11yScore = Math.max(0, Math.min(100, a11yScore));

  // ==========================================
  // 3. BEST PRACTICES (0-100)
  // ==========================================
  let bpScore = 100;

  const hasDoctype = document.doctype !== null;
  if (!hasDoctype) {
    bpScore -= 20;
    details.push({
      category: "Best Practices",
      details: "Missing <!doctype html>",
      metric: "HTML Doctype",
      scoreImpact: "-20",
      status: "Fail",
    });
  } else {
    details.push({
      category: "Best Practices",
      details: "Standard HTML5 doctype present",
      metric: "HTML Doctype",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  const hasCharset = Boolean(document.querySelector("meta[charset]"));
  if (!hasCharset) {
    bpScore -= 20;
    details.push({
      category: "Best Practices",
      details: 'Missing <meta charset="UTF-8">',
      metric: "Charset Declaration",
      scoreImpact: "-20",
      status: "Fail",
    });
  } else {
    details.push({
      category: "Best Practices",
      details: "UTF-8 charset defined",
      metric: "Charset Declaration",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    bpScore -= 20;
    details.push({
      category: "Best Practices",
      details: 'Missing <meta name="viewport">',
      metric: "Mobile Viewport",
      scoreImpact: "-20",
      status: "Fail",
    });
  } else {
    details.push({
      category: "Best Practices",
      details: "Responsive mobile viewport configured",
      metric: "Mobile Viewport",
      scoreImpact: "0",
      status: "Pass",
    });
  }
  bpScore = Math.max(0, Math.min(100, bpScore));

  // ==========================================
  // 4. SEO (0-100)
  // ==========================================
  let seoScore = 100;

  const title = document.title.trim();
  if (!title) {
    seoScore -= 30;
    details.push({
      category: "SEO",
      details: "Missing document.title",
      metric: "Document Title",
      scoreImpact: "-30",
      status: "Fail",
    });
  } else {
    details.push({
      category: "SEO",
      details: `"${title}"`,
      metric: "Document Title",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim();
  if (!metaDesc) {
    seoScore -= 25;
    details.push({
      category: "SEO",
      details: 'Missing <meta name="description">',
      metric: "Meta Description",
      scoreImpact: "-25",
      status: "Warning",
    });
  } else {
    details.push({
      category: "SEO",
      details: metaDesc.length > 50 ? `${metaDesc.slice(0, 47)}...` : metaDesc,
      metric: "Meta Description",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
  if (!canonical) {
    seoScore -= 15;
    details.push({
      category: "SEO",
      details: 'Missing <link rel="canonical">',
      metric: "Canonical URL",
      scoreImpact: "-15",
      status: "Warning",
    });
  } else {
    details.push({
      category: "SEO",
      details: canonical,
      metric: "Canonical URL",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
  if (!ogTitle) {
    seoScore -= 15;
    details.push({
      category: "SEO",
      details: "Missing og:title tag",
      metric: "Open Graph (Social)",
      scoreImpact: "-15",
      status: "Warning",
    });
  } else {
    details.push({
      category: "SEO",
      details: "og:title present",
      metric: "Open Graph (Social)",
      scoreImpact: "0",
      status: "Pass",
    });
  }

  if (h1s.length === 0) {
    seoScore -= 15;
  }
  seoScore = Math.max(0, Math.min(100, seoScore));

  // ==========================================
  // 5. LIGHTHOUSE CIRCULAR SPEEDOMETER GAUGES
  // ==========================================
  function createGaugeSvg(score: number, label: string): string {
    const color = score >= 90 ? "#0cce6b" : score >= 50 ? "#ffa400" : "#ff4e42";
    const radius = 19;
    const circumference = 2 * Math.PI * radius; // ≈ 119.38
    const strokeDash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="62" height="74" viewBox="0 0 62 74">
      <circle cx="31" cy="27" r="${radius}" fill="none" stroke="#27272a" stroke-width="3.8"/>
      <circle cx="31" cy="27" r="${radius}" fill="none" stroke="${color}" stroke-width="3.8"
        stroke-dasharray="${strokeDash.toFixed(1)} ${circumference.toFixed(1)}"
        stroke-linecap="round"
        transform="rotate(-90 31 27)"/>
      <text x="31" y="32" fill="${color}" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="700" text-anchor="middle">${score}</text>
      <text x="31" y="65" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" text-anchor="middle">${label}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const displayPath = routePath.length > 28 ? `${routePath.slice(0, 25)}…` : routePath;

  // Uncollapsed Console Group
  console.group(
    `%c 🌹 Rose Audit %c ${displayPath} `,
    "background: #b3405a; color: #fff; font-weight: bold; border-radius: 4px 0 0 4px; padding: 3px 8px; font-size: 11px;",
    "background: #241a1d; color: #f3e6e8; font-weight: 600; border-radius: 0 4px 4px 0; padding: 3px 8px; font-size: 11px;",
  );

  // 1. All 4 Lighthouse Speedometer Dials
  const svgPerf = createGaugeSvg(perfScore, "Performance");
  const svgA11y = createGaugeSvg(a11yScore, "Accessibility");
  const svgBp = createGaugeSvg(bpScore, "Best Practices");
  const svgSeo = createGaugeSvg(seoScore, "SEO");

  const gaugeStyle = (dataUri: string) =>
    `font-size: 1px; line-height: 74px; padding: 37px 31px; background-image: url('${dataUri}'); background-repeat: no-repeat; background-position: center; background-size: contain; margin: 2px 3px; display: inline-block;`;

  console.log(
    "%c \u00A0 %c \u00A0 %c \u00A0 %c \u00A0 ",
    gaugeStyle(svgPerf),
    gaugeStyle(svgA11y),
    gaugeStyle(svgBp),
    gaugeStyle(svgSeo),
  );

  // 2. 4-Category Scorecard Table
  const scorecard = [
    { Category: "Performance", Rating: getRating(perfScore), Score: `${perfScore} / 100` },
    { Category: "Accessibility", Rating: getRating(a11yScore), Score: `${a11yScore} / 100` },
    { Category: "Best Practices", Rating: getRating(bpScore), Score: `${bpScore} / 100` },
    { Category: "SEO", Rating: getRating(seoScore), Score: `${seoScore} / 100` },
  ];
  console.table(scorecard);

  // 3. Action Items (if any penalty)
  const issues = details.filter((d) => d.status !== "Pass");
  const passed = details.filter((d) => d.status === "Pass");

  if (issues.length > 0) {
    console.group(`⚠️ Action Items (${issues.length} issue${issues.length > 1 ? "s" : ""} to reach 100%):`);
    console.table(
      issues.map((i) => ({
        Category: i.category,
        Details: i.details,
        Metric: i.metric,
        Penalty: `${i.scoreImpact} pts`,
      })),
    );

    // Expandable node list logging offending DOM elements
    for (const item of issues) {
      if (item.elements && item.elements.length > 0) {
        console.warn(`Inspect [${item.category} → ${item.metric}]:`, item.elements);
      }
    }
    console.groupEnd();
  } else {
    console.log(
      "%c ✨ Perfect! All checks passed with 100% compliance across all categories. ",
      "background: #065f46; color: #a7f3d0; font-weight: bold; border-radius: 4px; padding: 2px 8px; margin: 4px 0;",
    );
  }

  // 4. Full Checklist Breakdown Table
  console.groupCollapsed(`📋 Full Checklist (${passed.length} Passed, ${issues.length} Issues)`);
  console.table(
    details.map((d) => ({
      Category: d.category,
      Details: d.details,
      Impact: d.scoreImpact === "0" ? "None" : `${d.scoreImpact} pts`,
      Metric: d.metric,
      Status: d.status === "Pass" ? "✅ Pass" : d.status === "Warning" ? "⚠️ Warning" : "❌ Fail",
    })),
  );
  console.groupEnd();

  console.groupEnd();
}
