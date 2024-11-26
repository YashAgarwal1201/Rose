import { ref } from "vue";

export function useSideMenu() {
  const isSideMenuVisible = ref<boolean>(false);

  const toggleSideMenu = () => {
    isSideMenuVisible.value = !isSideMenuVisible.value;
  };

  const openSideMenu = () => {
    // console.log(isSideMenuVisible.value);
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
