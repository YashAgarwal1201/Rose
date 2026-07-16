import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./styles/tailwind.css";
import { useThemeStore } from "./stores/theme";
import { registerSW } from "./registerSW.ts";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
registerSW();
useThemeStore().init();
