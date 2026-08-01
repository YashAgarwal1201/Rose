<!-- src/components/GlobalSearchModal.vue -->
<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="uiStore.isSearchOpen"
        class="fixed inset-0 z-120 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
        @click.self="uiStore.closeSearch()">
        <div
          class="w-full max-w-2xl bg-rose-surface border border-rose-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div class="relative shrink-0">
            <SearchIcon :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-rose-text-muted" />
            <input ref="searchInputRef" v-model="query" type="text" placeholder="Search your todos and docs..."
              class="w-full pl-12 pr-12 py-4 bg-transparent text-rose-text placeholder:text-rose-text-muted focus:outline-none text-lg"
              @keydown.escape.prevent="handleEscape" @keydown.down.prevent="navigateResults(1)"
              @keydown.up.prevent="navigateResults(-1)" @keydown.enter.prevent="selectResult(selectedIndex)" />
            <button v-if="query.length > 0" type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-rose-text-muted hover:text-rose-text transition-colors"
              @click="query = ''; searchInputRef?.focus()" aria-label="Clear search">
              <XIcon :size="20" />
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
            class="border-t border-rose-border px-4 py-6 text-center text-sm text-rose-text-muted">
            No matches found for "{{ query.trim() }}"
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
import { useUiStore } from "../stores/ui";
import { useHomeSummary } from "../composables/useHomeSummary";

const uiStore = useUiStore();
const router = useRouter();
const summary = useHomeSummary();

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

    if (result.type === "todo") {
      router.push(`/todos/list/${result.id}`);
    } else if (result.type === "note") {
      router.push(`/notes/note/${result.id}`);
    } else if (result.type === "doc") {
      router.push(`/docs/doc/${result.id}`);
    }
  }
}
</script>
