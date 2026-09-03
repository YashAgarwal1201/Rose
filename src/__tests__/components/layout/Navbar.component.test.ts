import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Navbar from "@/components/layout/Navbar.vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { IDBFactory } from "fake-indexeddb";
import db from "@/db";
import { useFoldersStore } from "@/stores/folders";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: { template: "<div></div>" } },
    { path: "/files/folder", name: "files", component: { template: "<div></div>" } }
  ]
});

describe("Navbar.vue", () => {
  it("renders navigation links and toggle button (with vault present)", async () => {
    expect.hasAssertions();

    // Set up fresh DB and Pinia
    db.close();
    globalThis.indexedDB = new IDBFactory();
    await db.open();
    const pinia = createPinia();
    setActivePinia(pinia);

    // Seed vault folder
    const foldersStore = useFoldersStore();
    await foldersStore.loadFolders(); // auto-seeds vault

    router.push("/");
    await router.isReady();

    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: { MenuIcon: true, HomeIcon: true, FolderIcon: true, LockIcon: true }
      }
    });

    const links = wrapper.findAll("a");
    expect(links).toHaveLength(3);
    expect(links[0]?.text()).toContain("Home");
    expect(links[1]?.text()).toContain("Files");
    expect(links[2]?.text()).toContain("Vault");

    const menuButton = wrapper.find("button");
    expect(menuButton.text()).toContain("Menu");

    await menuButton.trigger("click");
    expect(wrapper.emitted("toggleMenu")).toBeTruthy();
  });

  it("hides vault nav link when vault folder does not exist", async () => {
    expect.hasAssertions();

    // Fresh DB with no vault folder
    db.close();
    globalThis.indexedDB = new IDBFactory();
    await db.open();
    const pinia = createPinia();
    setActivePinia(pinia);

    // Do NOT call loadFolders - vault not seeded yet
    const foldersStore = useFoldersStore();
    // folders.value is empty

    router.push("/");
    await router.isReady();

    const wrapper = mount(Navbar, {
      global: {
        plugins: [router, pinia],
        stubs: { MenuIcon: true, HomeIcon: true, FolderIcon: true, LockIcon: true }
      }
    });

    const links = wrapper.findAll("a");
    // Only Home and Files - no Vault since foldersStore.folders is empty
    expect(links).toHaveLength(2);
    expect(links[0]?.text()).toContain("Home");
    expect(links[1]?.text()).toContain("Files");

    void foldersStore; // suppress unused warning
  });
});
