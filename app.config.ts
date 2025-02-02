export default defineAppConfig({
  ui: {
    primary: "rose",
    gray: "zinc",
  },
  head: {
    title: "Project Rose",
    charset: "utf-8",
    viewport: "width=device-width, initial-scale=1",
    link: [
      { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
      { rel: "apple-touch-icon", href: "/logo.svg" },
    ],
  },
});
