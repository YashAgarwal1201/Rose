import { ref } from "vue";

export function useSideMenu() {
  const isSideMenuVisible = ref(false);

  const toggleSideMenu = () => {
    isSideMenuVisible.value = !isSideMenuVisible.value;
  };

  const openSideMenu = () => {
    console.log("i am clicked");
    isSideMenuVisible.value = true;
  };

  const closeSideMenu = () => {
    isSideMenuVisible.value = false;
  };

  return {
    isSideMenuVisible,
    toggleSideMenu,
    openSideMenu,
    closeSideMenu,
  };
}
