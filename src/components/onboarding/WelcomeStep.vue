<!-- src/components/onboarding/WelcomeStep.vue -->
<template>
  <div class="min-h-full flex flex-col items-center px-4 py-8 sm:py-12 md:py-14 max-w-5xl mx-auto">
    <!-- Header -->
    <header class="text-center max-w-2xl mb-8 md:mb-10 flex flex-col items-center">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-surface border border-rose-border text-rose-text text-xs sm:text-sm font-semibold tracking-wide mb-5 select-none">
        <span class="w-2 h-2 rounded-full bg-rose-primary"></span>
        Rose · Local-First Workspace
      </div>

      <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-rose-text tracking-tight mb-4">
        A calm, private sanctuary for your <span class="text-rose-primary italic font-normal">thoughts</span>.
      </h1>

      <p class="text-sm sm:text-base text-rose-text-muted leading-relaxed max-w-xl mb-6">
        Rose brings your markdown documents, handwritten sketches, and task lists into one private file manager.
        Everything lives directly on your device — offline, encrypted, and permanently yours.
      </p>

      <button
        type="button"
        class="inline-flex items-center gap-2 bg-rose-primary text-white font-semibold text-sm sm:text-base px-6 py-2.5 rounded-lg hover:bg-rose-primary-hover transition-colors shadow-sm cursor-pointer"
        @click="emit('enter')"
      >
        Enter Rose
        <ArrowRightIcon class="w-4 h-4" />
      </button>
    </header>

    <!-- Desktop Window Preview -->
    <div class="w-full rounded-xl bg-rose-surface border border-rose-border shadow-sm overflow-hidden flex flex-col min-h-[460px] md:min-h-[500px]">
      <!-- Window Title Bar -->
      <div class="h-9 bg-rose-surface-alt/70 border-b border-rose-border flex items-center px-4 relative shrink-0">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black/15"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black/15"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black/15"></span>
        </div>
        <div class="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5 text-xs font-medium text-rose-text-muted">
          <FolderIcon class="w-3.5 h-3.5 text-rose-primary" />
          <span>Rose — Local Workspace</span>
        </div>
      </div>

      <!-- Window Body: Folders + Explorer -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Folders Column (hidden on mobile, matching real responsive layout) -->
        <aside class="hidden md:flex w-52 bg-rose-surface-alt/40 border-r border-rose-border p-5 flex-col shrink-0">
          <h2 class="text-sm font-bold text-rose-text mb-3">Folders</h2>
          <button type="button" class="text-xs font-medium text-rose-primary flex items-center gap-1 mb-4 cursor-default">
            + New folder
          </button>
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-surface-alt text-rose-primary">
              <FolderIcon class="w-4 h-4 shrink-0 text-rose-primary" />
              <span class="truncate">Projects & Ideas</span>
            </div>
            <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-text-muted hover:bg-rose-surface-alt/60 transition-colors">
              <FolderIcon class="w-4 h-4 shrink-0 text-rose-primary" />
              <span class="truncate">Daily Journal</span>
            </div>
            <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-text-muted hover:bg-rose-surface-alt/60 transition-colors">
              <FolderIcon class="w-4 h-4 shrink-0 text-rose-primary" />
              <span class="truncate">Personal Archive</span>
            </div>
          </div>
        </aside>

        <!-- Main Explorer Content -->
        <main class="flex-1 bg-rose-bg p-4 sm:p-6 flex flex-col overflow-y-auto min-w-0">
          <!-- Top Row -->
          <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 class="font-heading text-2xl font-bold text-rose-text">Files</h2>
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex bg-rose-surface-alt p-1 rounded-lg gap-0.5 border border-rose-border/40">
                <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-surface text-rose-text shadow-xs">All</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-medium text-rose-text-muted">Docs</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-medium text-rose-text-muted">Notes</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-medium text-rose-text-muted">Lists</span>
              </div>
              <button type="button" class="hidden sm:inline-flex items-center gap-1.5 bg-rose-surface text-rose-text text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-border cursor-default shadow-xs">
                + New folder
              </button>
              <button type="button" class="inline-flex items-center gap-1.5 bg-rose-primary text-white text-xs font-medium px-3.5 py-1.5 rounded-lg cursor-default">
                + New file
              </button>
            </div>
          </div>

          <!-- Breadcrumbs and Sort Bar -->
          <div class="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-surface-alt text-xs text-rose-text-muted border border-rose-border/40">
              <HomeIcon class="w-3.5 h-3.5" />
              <span>/</span>
              <span class="text-rose-text font-semibold">Projects & Ideas</span>
            </div>
            <div class="hidden sm:flex items-center gap-3 text-xs text-rose-text-muted">
              <span class="flex items-center gap-1">Name <ChevronUpIcon class="w-3.5 h-3.5" /></span>
              <span>Modified</span>
              <LayoutGridIcon class="w-3.5 h-3.5 text-rose-text" />
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 items-start">
            <!-- 1. Folder Item -->
            <div class="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-rose-surface-alt transition-colors">
              <FolderIcon class="w-12 h-12 text-rose-primary shrink-0" :stroke-width="1.5" />
              <span class="text-xs text-rose-text text-center truncate w-full font-medium">Architecture</span>
              <MoreVerticalIcon class="w-3.5 h-3.5 text-rose-text-muted/60" />
            </div>

            <!-- 2. Secure Vault Card -->
            <div class="w-full max-w-[108px] h-[100px] rounded-xl bg-rose-primary/10 border border-rose-primary/25 flex flex-col items-center justify-center gap-2 p-2 hover:bg-rose-primary/15 transition-colors mx-auto">
              <LockIcon class="w-9 h-9 text-rose-primary shrink-0" :stroke-width="1.75" />
              <span class="text-xs text-rose-text font-semibold text-center">Secure Vault</span>
            </div>

            <!-- 3. Document Item -->
            <div class="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-rose-surface-alt transition-colors">
              <FileTextIcon class="w-12 h-12 text-rose-text-muted dark:text-rose-cream shrink-0" :stroke-width="1.5" />
              <span class="text-xs text-rose-text text-center truncate w-full font-medium">Manifesto.md</span>
              <MoreVerticalIcon class="w-3.5 h-3.5 text-rose-text-muted/60" />
            </div>

            <!-- 4. Handwritten Note Item (With authentic vector ink sketch strokes) -->
            <div class="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-rose-surface-alt transition-colors">
              <div class="w-12 h-12 rounded-md bg-rose-surface-alt border border-rose-border flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                  <path d="M6 14 C 12 8, 22 10, 28 8 C 32 7, 34 11, 32 16 C 30 22, 14 26, 20 32" stroke="currentColor" class="text-rose-primary" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="10" cy="28" r="3" stroke="currentColor" class="text-rose-text" stroke-width="1.5"/>
                  <path d="M13 28 L 24 24" stroke="currentColor" class="text-rose-text-muted" stroke-width="1.5" stroke-dasharray="2 2"/>
                </svg>
              </div>
              <span class="text-xs text-rose-text text-center truncate w-full font-medium">Design Sketch</span>
              <MoreVerticalIcon class="w-3.5 h-3.5 text-rose-text-muted/60" />
            </div>

            <!-- 5. Todo List Item -->
            <div class="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-rose-surface-alt transition-colors">
              <ListTodoIcon class="w-12 h-12 text-rose-green shrink-0" :stroke-width="1.5" />
              <span class="text-xs text-rose-text text-center truncate w-full font-medium">Launch QA</span>
              <MoreVerticalIcon class="w-3.5 h-3.5 text-rose-text-muted/60" />
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Feature Pillars -->
    <footer class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 mt-10 sm:mt-14 max-w-4xl w-full border-t border-rose-border pt-8 text-center sm:text-left">
      <div>
        <h3 class="text-sm font-semibold text-rose-text mb-1">100% On-Device</h3>
        <p class="text-xs sm:text-sm text-rose-text-muted leading-relaxed">
          Zero cloud servers. Your files reside exclusively in your browser's local database.
        </p>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-rose-text mb-1">Encrypted Vault</h3>
        <p class="text-xs sm:text-sm text-rose-text-muted leading-relaxed">
          Lock sensitive folders with client-side AES-256 password protection.
        </p>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-rose-text mb-1">Zero Telemetry</h3>
        <p class="text-xs sm:text-sm text-rose-text-muted leading-relaxed">
          No user accounts, no analytics tracking, and instant offline access.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRightIcon,
  ChevronUpIcon,
  FileTextIcon,
  FolderIcon,
  HomeIcon,
  LayoutGridIcon,
  ListTodoIcon,
  LockIcon,
  MoreVerticalIcon,
} from "@lucide/vue";

const emit = defineEmits<{
  enter: [];
}>();
</script>
