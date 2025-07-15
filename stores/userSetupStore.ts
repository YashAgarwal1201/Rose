// stores/userSetup.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

const { setItem, getItem } = useAppStorage();

export const useUserSetupStore = defineStore('userSetup', () => {
  const userName = ref<string>('');
  const enabledFeatures = ref<string[]>([]);

  function loadFromStorage() {
    userName.value = getItem<string>('userName') ?? '';
    enabledFeatures.value = getItem<string[]>('enabledFeatures') ?? [];
  }

  function setUser(name: string) {
    userName.value = name;
    setItem('userName', name);
  }

  function setFeatures(features: string[]) {
    enabledFeatures.value = features;
    setItem('enabledFeatures', features);
  }

  return {
    userName,
    enabledFeatures,
    loadFromStorage,
    setUser,
    setFeatures,
  };
});
