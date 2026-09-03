<!-- src/components/GlobalSearchModal.vue -->
<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="uiStore.isSearchOpen" ref="dialogRef"
        class="fixed inset-0 z-120 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
        role="dialog" aria-modal="true" aria-label="Global search"
        @click.self="uiStore.closeSearch()" @keydown.escape="handleEscape">
        <div
          class="w-full max-w-2xl bg-rose-surface border border-rose-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div class="relative shrink-0">
            <SearchIcon :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-rose-text-muted" />
            <input ref="searchInputRef" v-model="query" type="text" placeholder="Search your todos, notes and docs..."
              aria-label="Search"
              class="w-full pl-12 pr-12 py-4 bg-transparent text-rose-text placeholder:text-rose-text-muted focus:outline-none text-lg"
              @keydown.escape.prevent="handleEscape" @keydown.down.prevent="navigateResults(1)"
              @keydown.up.prevent="navigateResults(-1)" @keydown.enter.prevent="selectResult(selectedIndex)" />
            <button v-if="query.length > 0" type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-rose-text-muted hover:text-rose-text transition-colors"
              @click="query = ''; searchInputRef?.focus()" aria-label="Clear search">
              <XIcon :size="20" />
            </button>
          </div>
          
          <div v-if="!query.trim()" class="border-t border-rose-border px-4 py-3 flex gap-2">
            <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-surface-alt hover:bg-rose-border/50 transition-colors text-sm font-medium text-rose-text" @click="openView('todos-all')">
              <ListTodoIcon :size="16" class="text-rose-primary" /> Todos
            </button>
            <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-surface-alt hover:bg-rose-border/50 transition-colors text-sm font-medium text-rose-text" @click="openView('notes-all')">
              <PenLineIcon :size="16" class="text-rose-primary" /> Notes
            </button>
            <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-surface-alt hover:bg-rose-border/50 transition-colors text-sm font-medium text-rose-text" @click="openView('docs-all')">
              <FileTextIcon :size="16" class="text-rose-primary" /> Docs
            </button>
          </div>

          <div v-if="query.trim() && searchResults.length > 0"
            class="border-t border-rose-border max-h-[60vh] overflow-y-auto">
            <button v-for="(result, index) in searchResults" :key="`${result.type}-${result.id}`" ref="resultRefs"
              type="button" class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              :class="index === selectedIndex ? 'bg-rose-surface-alt' : 'hover:bg-rose-surface-alt'"
              @click="selectResult(index)" @mouseenter="selectedIndex = index">
              <ListTodoIcon v-if="result.type === 'todo'" :size="18" class="text-rose-text-muted shrink-0"
                :class="index === selectedIndex ? 'text-rose-primary' : ''" />
              <PenLineIcon v-else-if="result.type === 'note'" :size="18" class="text-rose-text-muted shrink-0"
                :class="index === selectedIndex ? 'text-rose-primary' : ''" />
              <FileTextIcon v-else :size="18" class="text-rose-text-muted shrink-0"
                :class="index === selectedIndex ? 'text-rose-primary' : ''" />
              <span class="text-base text-rose-text truncate">{{ result.title }}</span>
            </button>
          </div>
          <div v-else-if="query.trim() && summary.isLoaded.value"
            class="border-t border-rose-border px-4 py-12 flex flex-col items-center justify-center text-center">
            <img :src="NoFileFoundIllustration" alt="No matches" class="w-32 h-auto mb-4 opacity-80 select-none pointer-events-none" />
            <span class="text-sm text-rose-text-muted">No matches found for "{{ query.trim() }}"</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { FileTextIcon, ListTodoIcon, PenLineIcon, SearchIcon, XIcon } from "@lucide/vue";
import { useUiStore } from "@/stores/ui";
import { useHomeSummary } from "@/composables/home/useHomeSummary.ts";
import { useBackButtonClose } from "@/composables/ui/useBackButtonClose.ts";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";
import NoFileFoundIllustration from "@/assets/illustrations/no-file-found.svg";

const uiStore = useUiStore();
const router = useRouter();
const summary = useHomeSummary();

const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef, { escapeDeactivates: false });
watch(dialogRef, (el) => el ? nextTick().then(() => activate()) : deactivate());

useBackButtonClose(
  computed(() => uiStore.isSearchOpen),
  "search",
  () => uiStore.closeSearch(),
  () => uiStore.openSearch()
);

const query = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);
const resultRefs = ref<HTMLElement[]>([]);
const selectedIndex = ref(-1);

const searchResults = computed(() => summary.search(query.value));

watch(
  () => uiStore.isSearchOpen,
  async (isOpen) => {
    if (isOpen) {
      query.value = "";
      selectedIndex.value = -1;
      summary.refresh(); // Ensure we have the latest items loaded
      await nextTick();
      searchInputRef.value?.focus();
    }
  }
);

watch(query, () => {
  selectedIndex.value = searchResults.value.length > 0 ? 0 : -1;
});

function handleEscape() {
  if (query.value) {
    query.value = "";
  } else {
    uiStore.closeSearch();
  }
}

function navigateResults(direction: number) {
  if (searchResults.value.length === 0) { return };
  const newIndex = selectedIndex.value + direction;
  if (newIndex >= 0 && newIndex < searchResults.value.length) {
    selectedIndex.value = newIndex;

    // Scroll into view
    nextTick().then(() => {
      const el = resultRefs.value[selectedIndex.value];
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }
}

function selectResult(index: number) {
  if (index >= 0 && index < searchResults.value.length) {
    const result = searchResults.value[index];
    if (!result) { return };

    uiStore.closeSearch();

    setTimeout(() => {
      if (result.type === "todo") {
        router.push({ name: "todos-list", params: { pathMatch: result.path } });
      } else if (result.type === "note") {
        router.push({ name: "notes-note", params: { pathMatch: result.path } });
      } else if (result.type === "doc") {
        router.push({ name: "docs-doc", params: { pathMatch: result.path } });
      }
    }, 100);
  }
}

function openView(routeName: string) {
  uiStore.closeSearch();
  setTimeout(() => {
    router.push({ name: routeName });
  }, 100);
}
</script>
