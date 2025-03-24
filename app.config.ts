export default defineAppConfig({
  layout: {
    transition: "slide",
  },
  ui: {
    primary: "rose",
    gray: "zinc",

    notifications: {
      // Show toasts at the top right of the screen
      position: "top-0 bottom-[unset]",
    },
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
