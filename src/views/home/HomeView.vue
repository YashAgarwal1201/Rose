<!-- src/views/HomeView.vue -->
<template>
  <div class="p-4 md:p-8 lg:p-10 flex flex-col min-h-full">
    <!-- Greeting -->
    <div class="shrink-0">
      <h1 class="text-2xl sm:text-3xl font-bold text-rose-text">{{ greeting }}</h1>
      <p class="text-sm sm:text-base text-rose-text-muted mt-1">{{ formattedDate }}</p>
    </div>

    <!-- Search -->
    <div v-if="!summary.isEmpty.value" class="relative mt-6 max-w-2xl shrink-0">
      <SearchIcon :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-text-muted" />
      <input v-model="query" type="text" placeholder="Search your todos, notes and docs..."
        class="w-full pl-10 pr-10 py-3 rounded-xl bg-rose-surface border border-rose-border text-rose-text placeholder:text-rose-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
        @keyup.escape="query = ''" />
      <button v-if="query.length > 0" type="button"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-text-muted hover:text-rose-text transition-colors"
        @click="query = ''" aria-label="Clear search">
        <XIcon :size="16" />
      </button>

      <div v-if="query.trim() && searchResults.length > 0"
        class="absolute z-10 mt-2 w-full rounded-xl bg-rose-surface border border-rose-border shadow-xl overflow-hidden">
        <button v-for="result in searchResults" :key="`${result.type}-${result.id}`" type="button"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-rose-surface-alt transition-colors"
          @click="openItem(result)">
          <ListTodoIcon v-if="result.type === 'todo'" :size="16" class="text-rose-text-muted shrink-0" />
          <PenLineIcon v-else-if="result.type === 'note'" :size="16" class="text-rose-text-muted shrink-0" />
          <FileTextIcon v-else :size="16" class="text-rose-text-muted shrink-0" />
          <span class="text-sm text-rose-text truncate">{{ result.title }}</span>
        </button>
      </div>

      <div v-else-if="query.trim() && summary.isLoaded.value"
        class="absolute z-10 mt-2 w-full rounded-xl bg-rose-surface border border-rose-border shadow-xl px-4 py-3 text-sm text-rose-text-muted">
        No matches for "{{ query.trim() }}"
      </div>
    </div>

    <!-- Empty state: nothing created anywhere yet -->
    <div v-if="summary.isEmpty.value" class="m-auto flex flex-col items-center justify-center pb-20 text-center">
      <div class="mb-4 w-14 h-14 rounded-2xl bg-rose-primary/10 flex items-center justify-center">
        <SparklesIcon :size="24" class="text-rose-primary" />
      </div>
      <h2 class="text-xl font-semibold text-rose-text">Nothing here yet</h2>
      <p class="text-sm text-rose-text-muted mt-1">
        Jump into one of your enabled features to create your first folder.
      </p>
      <div class="flex flex-wrap justify-center gap-3 mt-6">
        <QuickJumpCard v-for="tile in quickJumpTiles" :key="tile.feature" v-bind="tile" />
      </div>
    </div>

    <!-- Populated state -->
    <template v-else>
      <!-- Folders -->
      <div v-if="summary.topFolders.value.length > 0" class="mt-8">
        <h2 class="text-xl font-semibold text-rose-text-muted uppercase tracking-wide">Folders</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-3">
          <HomeFolderTile v-for="folder in summary.topFolders.value" :key="folder.id" :folder="folder"
            :route-name="folderRouteName(folder.type)" />
          <div v-if="summary.overflowFolderCount.value > 0"
            class="flex items-center justify-center rounded-lg bg-rose-surface text-rose-text-muted text-sm px-3.5 py-3">
            +{{ summary.overflowFolderCount.value }} more
          </div>
        </div>
      </div>

      <!-- Recent -->
      <div v-if="summary.recentItems.value.length > 0" class="mt-8">
        <h2 class="text-xl font-semibold text-rose-text-muted uppercase tracking-wide">Recent</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-3">
          <HomeFileCard v-for="item in summary.recentItems.value" :key="`${item.type}-${item.id}`" :item="item"
            @open="openItem(item)" />
        </div>
      </div>

      <!-- Recent this week, split by feature. Shown/hidden per enabled feature; -->
      <!-- each widget also self-hides when there's nothing from the last 7 days. -->
      <HomeRecentScroller v-if="settingsStore.isFeatureEnabled('todo')" title="Recent todos"
        :items="summary.recentTodos.value" @open="openItem" />
      <HomeRecentScroller v-if="settingsStore.isFeatureEnabled('doc')" title="Recent docs"
        :items="summary.recentDocs.value" @open="openItem" />
      <HomeRecentScroller v-if="settingsStore.isFeatureEnabled('note')" title="Recent notes"
        :items="summary.recentNotes.value" @open="openItem" />

      <HomeActivityCard />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { FileTextIcon, ListTodoIcon, PenLineIcon, SearchIcon, SparklesIcon, XIcon } from "@lucide/vue";
import { useSettingsStore } from "@/stores/settings";
import { type HomeItem, useHomeSummary } from "@/composables/home/useHomeSummary.ts";
import QuickJumpCard from "@/components/home/QuickJumpCard.vue";
import HomeFolderTile from "@/components/home/HomeFolderTile.vue";
import HomeFileCard from "@/components/home/HomeFileCard.vue";
import type { FeatureType } from "@/db/types";
import HomeRecentScroller from "@/components/home/HomeRecentScroller.vue";
import HomeActivityCard from "@/components/home/HomeActivityCard.vue";

const router = useRouter();
const settingsStore = useSettingsStore();
const summary = useHomeSummary();

const query = ref("");

function timeOfDayFor(hour: number): string {
  if (hour < 12) {
    return "morning";
  }
  if (hour < 18) {
    return "afternoon";
  }
  return "evening";
}

const greeting = computed(() => {
  const timeOfDay = timeOfDayFor(new Date().getHours());
  return settingsStore.username
    ? `Good ${timeOfDay}, ${settingsStore.username}`
    : `Good ${timeOfDay}`;
});

const formattedDate = computed(() =>
  new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    weekday: "long",
  }),
);

const searchResults = computed(() => summary.search(query.value));

const quickJumpConfig: {
  feature: FeatureType;
  label: string;
  icon: unknown;
  routeName: string;
}[] = [
    { feature: "todo", icon: ListTodoIcon, label: "Todos", routeName: "todos-all" },
    { feature: "note", icon: PenLineIcon, label: "Notes", routeName: "notes-all" },
    { feature: "doc", icon: FileTextIcon, label: "Docs", routeName: "docs-all" },
  ];

const quickJumpTiles = computed(() =>
  quickJumpConfig.filter((tile) => settingsStore.isFeatureEnabled(tile.feature)),
);

const folderRouteNames: Record<FeatureType | "mixed", string> = {
  doc: "docs-all",
  note: "notes-all",
  todo: "todos-all",
  mixed: "files-folder",
};

function folderRouteName(type: FeatureType | "mixed"): string {
  return folderRouteNames[type];
}

function openItem(item: HomeItem) {
  query.value = "";
  if (item.type === "todo") {
    router.push({ name: "files-list", params: { pathMatch: item.path } });
  } else if (item.type === "note") {
    router.push({ name: "files-note", params: { pathMatch: item.path } });
  } else {
    router.push({ name: "files-doc", params: { pathMatch: item.path } });
  }
}

onMounted(summary.refresh);
</script>
