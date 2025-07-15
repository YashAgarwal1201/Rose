export default defineNuxtRouteMiddleware((to) => {
  const store = useUserSetupStore();
  store.loadFromStorage();

  // Avoid redirect loop
  if (to.path === '/customise-app') return;

  if (!store.userName || store.enabledFeatures.length === 0) {
    return navigateTo('/customise-app');
  }
});
