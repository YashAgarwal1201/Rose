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

      // {
      //   rel: "stylesheet",
      //   href: "https://fonts.bunny.net/css?family=rubik:300,300i,400,400i,500,500i,600,600i,700,700i,800,800i|spectral:200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i",
      // },

      {
        rel: "stylesheet",
        href: "https://fonts.bunny.net/css?family=manrope:200,300,400,500,600,700,800|petrona:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i",
      },
    ],
  },
});
