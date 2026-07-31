<!-- src/components/home/HomeContributionAreaChart.vue -->
<template>
  <div class="flex items-center justify-center">
    <svg viewBox="0 0 260 260" class="w-full max-w-65 mx-auto" role="img" :aria-label="ariaLabel">
      <line
        v-for="point in axisPoints"
        :key="`axis-${point.type}`"
        :x1="center"
        :y1="center"
        :x2="point.axisX"
        :y2="point.axisY"
        class="stroke-rose-border"
        stroke-width="1"
      />

      <polygon
        :points="polygonPoints"
        class="fill-rose-primary/20 stroke-rose-primary"
        stroke-width="1.5"
      />

      <circle
        v-for="point in axisPoints"
        :key="`vertex-${point.type}`"
        :cx="point.valueX"
        :cy="point.valueY"
        r="3.5"
        class="fill-rose-primary"
      />

      <text
        v-for="point in axisPoints"
        :key="`pct-${point.type}`"
        :x="point.percentX"
        :y="point.percentY"
        :text-anchor="point.anchor"
        dominant-baseline="middle"
        class="fill-rose-text text-[11px]"
      >
        {{ point.segment.percentage }}%
      </text>

      <text
        v-for="point in axisPoints"
        :key="`name-${point.type}`"
        :x="point.nameX"
        :y="point.nameY"
        :text-anchor="point.anchor"
        dominant-baseline="middle"
        class="fill-rose-text-muted text-[11px]"
      >
        {{ point.segment.label }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DistributionSegment } from "../../composables/useContributionDistribution";

const { segments } = defineProps<{ segments: DistributionSegment[] }>();

const VIEWBOX_SIZE = 260;
const CENTER = VIEWBOX_SIZE / 2;
const MAX_RADIUS = 78;
const PERCENT_LABEL_RADIUS = 100;
const NAME_LABEL_RADIUS = 116;

const center = CENTER;

function pointOnAxis(index: number, count: number, radius: number) {
  const angleDeg = index * (360 / count) - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  };
}

function anchorFor(x: number): "start" | "middle" | "end" {
  if (x > CENTER + 4) {
    return "start";
  }
  if (x < CENTER - 4) {
    return "end";
  }
  return "middle";
}

const axisPoints = computed(() => {
  const count = segments.length;
  return segments?.map((segment, index) => {
    const axis = pointOnAxis(index, count, MAX_RADIUS);
    const value = pointOnAxis(index, count, (segment.percentage / 100) * MAX_RADIUS);
    const percentLabel = pointOnAxis(index, count, PERCENT_LABEL_RADIUS);
    const nameLabel = pointOnAxis(index, count, NAME_LABEL_RADIUS);
    return {
      anchor: anchorFor(percentLabel.x),
      axisX: axis.x,
      axisY: axis.y,
      nameX: nameLabel.x,
      nameY: nameLabel.y,
      percentX: percentLabel.x,
      percentY: percentLabel.y,
      segment,
      type: segment.type,
      valueX: value.x,
      valueY: value.y,
    };
  });
});

const polygonPoints = computed(() =>
  axisPoints.value.map((point) => `${point.valueX},${point.valueY}`).join(" "),
);

const ariaLabel = computed(() => segments?.map((s) => `${s.label} ${s.percentage}%`).join(", "));
</script>
