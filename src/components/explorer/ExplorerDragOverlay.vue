<!-- src/components/explorer/ExplorerDragOverlay.vue -->
<script setup lang="ts">
import { DragOverlay, useDragOperation } from '@dnd-kit/vue';
import { computed } from 'vue';
// In lucide-vue-next they are named like this, but wait! The app imports them from "@lucide/vue". Let me adjust.
import {
  FileTextIcon as FileTextIconLucide,
  FolderIcon as FolderIconLucide,
  ListTodoIcon as ListTodoIconLucide,
  PenLineIcon as PenLineIconLucide
} from "@lucide/vue";

const dragOperation = useDragOperation();
const sourceData = computed(() => dragOperation.source?.data);

function itemIcon(kind: string) {
  switch (kind) {
    case "folder": { return FolderIconLucide;
    }
    case "doc": { return FileTextIconLucide;
    }
    case "note": { return PenLineIconLucide;
    }
    case "todo": { return ListTodoIconLucide;
    }
    default: { return FileTextIconLucide;
    }
  }
}

function itemIconClass(kind: string) {
  switch (kind) {
    case "folder": { return "text-rose-primary";
    }
    case "doc": { return "text-rose-cream";
    }
    case "note": { return "text-rose-purple";
    }
    case "todo": { return "text-rose-blue";
    }
    default: { return "";
    }
  }
}
</script>

<template>
  <DragOverlay v-if="sourceData" :dropAnimation="null">
    <!-- Render a nice ghost image based on the data -->
    <div class="flex items-center gap-3 p-3 rounded-lg bg-rose-surface border border-rose-border shadow-xl opacity-90 backdrop-blur-md">
      <component :is="itemIcon(sourceData.kind)" class="w-6 h-6 shrink-0" :class="itemIconClass(sourceData.kind)" />
      <span class="text-sm font-medium text-rose-text truncate max-w-[200px]">{{ sourceData.name }}</span>
    </div>
  </DragOverlay>
</template>
