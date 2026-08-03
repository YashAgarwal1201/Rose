import type { Editor } from "@tiptap/core";
import type { Ref } from "vue";

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim() || "Untitled";
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const EXPORT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    color: #2b1a1e;
    background: #ffffff;
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1.5rem 4rem;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.25;
    margin: 1.5rem 0 0.5rem;
  }
  h1 { font-size: 2em; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.25em; }
  h4 { font-size: 1.1em; }

  p { margin: 0.5rem 0; }

  strong { font-weight: 700; }
  em { font-style: italic; }
  s { text-decoration: line-through; }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875em;
    background: #f6ecee;
    padding: 0.15em 0.35em;
    border-radius: 4px;
  }

  pre {
    background: #f6ecee;
    border: 1px solid #e6d3d7;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  pre code { background: none; padding: 0; font-size: 0.875em; }

  blockquote {
    border-left: 4px solid #b3405a;
    margin: 1rem 0;
    padding: 0.25rem 0 0.25rem 1rem;
    color: #7a6367;
  }

  hr { border: none; border-top: 1px solid #e6d3d7; margin: 1.5rem 0; }

  a { color: #b3405a; text-decoration: underline; text-underline-offset: 2px; }
  a:hover { opacity: 0.8; }

  img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5rem 0; }

  ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  ul ul { list-style: circle; }
  ol ol { list-style: lower-alpha; }
  li { margin: 0.2rem 0; }
  li > p { margin: 0; }

  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.3rem 0; }
  ul[data-type="taskList"] li > label { margin-top: 0.2rem; display: flex; align-items: center; }
  ul[data-type="taskList"] li > label > input[type="checkbox"] { width: 1rem; height: 1rem; accent-color: #b3405a; cursor: default; }
  ul[data-type="taskList"] li > div { flex: 1; }

  table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1rem 0; }
  td, th { border: 1px solid #e6d3d7; padding: 0.4rem 0.75rem; vertical-align: top; text-align: left; word-break: break-word; }
  th { background-color: #f6ecee; font-weight: 600; }
  table[data-bordered="false"] td,
  table[data-bordered="false"] th { border-color: transparent; }
`;

const PRINT_STYLES = `
  @media print {
    @page {
      size: A4;
      margin: 20mm 18mm;
    }

    body {
      max-width: 100%;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      color: #000000;
      background: #ffffff;
    }

    /* Avoid breaking headings from their following content */
    h1, h2, h3, h4, h5, h6 {
      break-after: avoid;
      page-break-after: avoid;
    }

    /* Avoid breaking inside these elements */
    pre, blockquote, table, figure, img {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Avoid orphaned list items */
    li {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Tables — keep borders visible in print */
    td, th {
      border: 1px solid #cccccc !important;
    }
    th {
      background-color: #f0f0f0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Preserve cell background colors */
    td[style], th[style] {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Print links as-is, don't append URL */
    a::after { content: none !important; }

    /* Hide the auto-print script tag visually */
    script { display: none; }
  }
`;

function buildHtmlDocument(title: string, bodyContent: string, extraStyles = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${EXPORT_STYLES}${extraStyles}</style>
</head>
<body>
  <h1>${title}</h1>
  ${bodyContent}
</body>
</html>`;
}

export function useDocExport(
  editor: Ref<Editor | undefined>,
  docTitle: Ref<string | undefined>,
  isExportMenuOpen: Ref<boolean>,
) {
  function exportAsHtml() {
    if (!editor.value || !docTitle.value) {
      return;
    }
    const html = buildHtmlDocument(docTitle.value, editor.value.getHTML());
    downloadFile(html, `${sanitizeFilename(docTitle.value)}.html`, "text/html");
    isExportMenuOpen.value = false;
  }

  function exportAsMarkdown() {
    if (!editor.value || !docTitle.value) {
      return;
    }
    downloadFile(
      (editor.value as Editor & { getMarkdown: () => string }).getMarkdown(),
      `${sanitizeFilename(docTitle.value)}.md`,
      "text/markdown",
    );
    isExportMenuOpen.value = false;
  }

  function exportAsText() {
    if (!editor.value || !docTitle.value) {
      return;
    }
    downloadFile(editor.value.getText(), `${sanitizeFilename(docTitle.value)}.txt`, "text/plain");
    isExportMenuOpen.value = false;
  }

  function exportAsPdf() {
    if (!editor.value || !docTitle.value) {
      return;
    }

    const html = buildHtmlDocument(
      docTitle.value,
      editor.value.getHTML(),
      `${PRINT_STYLES}
      /* Auto-trigger print on load */`,
    );

    // Inject the auto-print script into the body
    const printHtml = html.replace(
      "</body>",
      `<script>
        window.addEventListener('load', function () {
          window.print();
          window.addEventListener('afterprint', function () {
            window.close();
          });
        });
      </script>
</body>`,
    );

    const blob = new Blob([printHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, "_blank");

    // Revoke the object URL after a delay to allow the tab to fully load
    if (tab) {
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } else {
      // Fallback if popup was blocked — just download the HTML
      downloadFile(printHtml, `${sanitizeFilename(docTitle.value)}.html`, "text/html");
      URL.revokeObjectURL(url);
    }

    isExportMenuOpen.value = false;
  }

  return { exportAsHtml, exportAsMarkdown, exportAsText, exportAsPdf };
}
