// src/composables/useHandwritingCanvas.ts
import { onBeforeUnmount, ref, type Ref, shallowRef, watch } from "vue";
import { Canvas, Ellipse, FabricImage, type FabricObject, Line, Path, Rect, Textbox } from "fabric";
import getStroke from "perfect-freehand";

export type PenTool = "pencil" | "pen" | "marker";
export type ShapeTool = "rectangle" | "ellipse" | "line" | "arrow";
export type CanvasTool = "select" | "pen" | "eraser" | "text" | "shape" | "image";

// Stored as tuples directly — avoids a .map() allocation on every hot pointer event.
type StrokePoint = [x: number, y: number, pressure: number];

interface PenPreset {
  size: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  opacity: number;
  sendToBack: boolean; // marker/highlighter shouldn't cover existing ink
}

const PEN_PRESETS: Record<PenTool, PenPreset> = {
  pencil: {
    size: 5,
    thinning: 0.35,
    smoothing: 0.4,
    streamline: 0.3,
    opacity: 0.85,
    sendToBack: false,
  },
  pen: {
    size: 7,
    thinning: 0.65,
    smoothing: 0.5,
    streamline: 0.5,
    opacity: 1,
    sendToBack: false,
  },
  marker: {
    size: 22,
    thinning: 0,
    smoothing: 0.5,
    streamline: 0.5,
    opacity: 0.35,
    sendToBack: true,
  },
};

// Fabric/the web platform don't expose true palm contact size reliably, so
// this is a heuristic (suppress touch while a pen is active, plus a short
// grace window after it lifts) — not guaranteed palm detection. See
// fabricjs/fabric.js#9595 for why size-based detection isn't trustworthy.
const PALM_REJECTION_GRACE_MS = 400;

const CANVAS_MIN_HEIGHT = 900;
const CANVAS_GROW_STEP = 600;
const CANVAS_GROW_THRESHOLD = 200; // grow when content comes within this many px of the bottom

interface HistoryEntry {
  type: "add" | "remove";
  object: FabricObject;
}

export function useHandwritingCanvas(_canvasEl: Ref<HTMLCanvasElement | null>) {
  const fabricCanvas = shallowRef<Canvas | null>(null);

  const tool = ref<CanvasTool>("pen");
  const penTool = ref<PenTool>("pen");
  const shapeTool = ref<ShapeTool>("rectangle");
  const penColor = ref("#1a1a1a");
  const backgroundColor = ref("#ffffff");
  const canUndo = ref(false);
  const canRedo = ref(false);

  let resizeObserver: ResizeObserver | null = null;

  let undoStack: HistoryEntry[] = [];
  let redoStack: HistoryEntry[] = [];
  let suppressHistory = false;

  let activePenPointerId: number | null = null;
  let lastPenActivityAt = 0;
  let strokePoints: StrokePoint[] = [];
  let drawing = false;
  let erasing = false;

  // Tracked incrementally — avoids O(n) scan of all objects on every stroke.
  let maxContentBottom = 0;

  // RAF handle for the live preview loop — cancelled on pointerup.
  let previewRafId: number | null = null;
  // Whether the stroke points have changed since the last preview frame.
  let strokeDirty = false;

  // Cached 2D context for the overlay canvas used by live preview.
  let overlayCtx: CanvasRenderingContext2D | null = null;

  function refreshHistoryFlags() {
    canUndo.value = undoStack.length > 0;
    canRedo.value = redoStack.length > 0;
  }

  function pushHistory(entry: HistoryEntry) {
    if (suppressHistory) {
      return;
    }
    undoStack.push(entry);
    redoStack = [];
    refreshHistoryFlags();
  }

  function undo() {
    const canvas = fabricCanvas.value;
    const entry = undoStack.pop();
    if (!canvas || !entry) {
      return;
    }
    suppressHistory = true;
    if (entry.type === "add") {
      canvas.remove(entry.object);
    } else {
      canvas.add(entry.object);
    }
    canvas.requestRenderAll();
    suppressHistory = false;
    redoStack.push(entry);
    refreshHistoryFlags();
  }

  function redo() {
    const canvas = fabricCanvas.value;
    const entry = redoStack.pop();
    if (!canvas || !entry) {
      return;
    }
    suppressHistory = true;
    if (entry.type === "add") {
      canvas.add(entry.object);
    } else {
      canvas.remove(entry.object);
    }
    canvas.requestRenderAll();
    suppressHistory = false;
    undoStack.push(entry);
    refreshHistoryFlags();
  }

  // ---------------------------------------------------------------------------
  // perfect-freehand stroke → filled Fabric Path
  // ---------------------------------------------------------------------------

  // Returns empty string (falsy) on degenerate strokes, never undefined — fixes
  // the original implicit-undefined-return TypeScript error.
  function strokeToPathData(points: StrokePoint[], preset: PenPreset): string {
    const outline = getStroke(points, {
      size: preset.size,
      thinning: preset.thinning,
      smoothing: preset.smoothing,
      streamline: preset.streamline,
      simulatePressure: points.every((p) => p[2] === 0.5),
    });
    if (outline.length === 0) {
      return "";
    }

    const [first, ...rest] = outline;
    if (!first) {
      return "";
    } // narrows `first` from `number[] | undefined` to `number[]`

    const d = rest.reduce((acc, [x, y]) => `${acc} L ${x} ${y}`, `M ${first[0]} ${first[1]}`);
    return `${d} Z`;
  }

  // ---------------------------------------------------------------------------
  // Live preview — drawn to Fabric's upper (overlay) canvas each RAF tick.
  // The overlay is cleared on commit so the real Path replaces it seamlessly.
  // ---------------------------------------------------------------------------

  function drawLivePreview() {
    if (!overlayCtx || !strokeDirty || strokePoints.length < 2) {
      previewRafId = requestAnimationFrame(drawLivePreview);
      return;
    }
    strokeDirty = false;

    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }

    const preset = PEN_PRESETS[penTool.value];
    const outline = getStroke(strokePoints, {
      size: preset.size,
      thinning: preset.thinning,
      smoothing: preset.smoothing,
      streamline: preset.streamline,
      simulatePressure: strokePoints.every((p) => p[2] === 0.5),
    });

    // Fabric's own helper correctly accounts for retina scaling when clearing —
    // no manual width/height math needed.
    canvas.clearContext(overlayCtx);

    if (outline.length < 2) {
      previewRafId = requestAnimationFrame(drawLivePreview);
      return;
    }

    const [first, ...rest] = outline;
    if (!first) {
      previewRafId = requestAnimationFrame(drawLivePreview);
      return;
    }

    // No manual scale() here — contextTop already carries Fabric's
    // retina-scaling transform permanently. Draw directly in scene coordinates,
    // exactly like the coordinates returned by canvas.getScenePoint().
    overlayCtx.save();
    overlayCtx.globalAlpha = preset.opacity;
    overlayCtx.fillStyle = penColor.value;
    overlayCtx.beginPath();
    overlayCtx.moveTo(first[0], first[1]);
    for (const [x, y] of rest) {
      overlayCtx.lineTo(x, y);
    }
    overlayCtx.closePath();
    overlayCtx.fill();
    overlayCtx.restore();

    previewRafId = requestAnimationFrame(drawLivePreview);
  }

  function startPreviewLoop() {
    if (previewRafId !== null) {
      return;
    }
    previewRafId = requestAnimationFrame(drawLivePreview);
  }

  function stopPreviewLoop() {
    if (previewRafId !== null) {
      cancelAnimationFrame(previewRafId);
      previewRafId = null;
    }
    const canvas = fabricCanvas.value;
    if (canvas && overlayCtx) {
      canvas.clearContext(overlayCtx);
    }
  }

  // ---------------------------------------------------------------------------
  // Stroke commit
  // ---------------------------------------------------------------------------

  function commitStroke() {
    const canvas = fabricCanvas.value;
    if (!canvas || strokePoints.length < 2) {
      strokePoints = [];
      return;
    }
    const preset = PEN_PRESETS[penTool.value];
    const pathData = strokeToPathData(strokePoints, preset);
    strokePoints = [];
    if (!pathData) {
      return;
    }

    const path = new Path(pathData, {
      fill: penColor.value,
      stroke: null,
      opacity: preset.opacity,
      // Selectability is managed centrally by the tool watcher — don't
      // bake it in at add-time so it stays in sync regardless of when the
      // watcher last fired.
      selectable: false,
      evented: false,
    });

    canvas.add(path);

    if (preset.sendToBack) {
      canvas.sendObjectToBack(path);
    }

    pushHistory({ type: "add", object: path });

    // Update the incremental content-bottom tracker for growCanvasIfNeeded.
    const bounds = path.getBoundingRect();
    maxContentBottom = Math.max(maxContentBottom, bounds.top + bounds.height);

    growCanvasIfNeeded();
    // Single requestRenderAll after everything is settled.
    canvas.requestRenderAll();
  }

  // ---------------------------------------------------------------------------
  // Infinite vertical scroll
  // ---------------------------------------------------------------------------

  function growCanvasIfNeeded() {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }
    const currentHeight = canvas.getHeight();
    if (maxContentBottom > currentHeight - CANVAS_GROW_THRESHOLD) {
      canvas.setDimensions({ height: currentHeight + CANVAS_GROW_STEP });
      // No requestRenderAll here — commitStroke (and addImage) call it after.
    }
  }

  // ---------------------------------------------------------------------------
  // Palm rejection + manual pen capture
  // ---------------------------------------------------------------------------

  function isPalmRejected(event: PointerEvent): boolean {
    if (event.pointerType === "touch") {
      const withinGrace = Date.now() - lastPenActivityAt < PALM_REJECTION_GRACE_MS;
      return activePenPointerId !== null || withinGrace;
    }
    return false;
  }

  function handlePointerDown(event: PointerEvent) {
    if (tool.value !== "pen") {
      return;
    }
    if (isPalmRejected(event)) {
      return;
    }
    if (event.pointerType === "pen" || event.pointerType === "mouse") {
      activePenPointerId = event.pointerId;
      lastPenActivityAt = Date.now();
    }
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }
    const point = canvas.getScenePoint(event);
    drawing = true;
    strokePoints = [[point.x, point.y, event.pressure || 0.5]];
    strokeDirty = true;
    startPreviewLoop();
  }

  function handlePointerMove(event: PointerEvent) {
    if (!drawing || tool.value !== "pen") {
      return;
    }
    if (activePenPointerId !== null && event.pointerId !== activePenPointerId) {
      return;
    }
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }
    const point = canvas.getScenePoint(event);
    strokePoints.push([point.x, point.y, event.pressure || 0.5]);
    lastPenActivityAt = Date.now();
    strokeDirty = true;
  }

  function handlePointerUp(event: PointerEvent) {
    if (!drawing) {
      return;
    }
    if (activePenPointerId !== null && event.pointerId !== activePenPointerId) {
      return;
    }
    drawing = false;
    activePenPointerId = null;
    lastPenActivityAt = Date.now();
    stopPreviewLoop();
    commitStroke();
  }

  // ---------------------------------------------------------------------------
  // Eraser — drag-to-erase with RAF throttle, avoids Fabric hit-test overhead
  // ---------------------------------------------------------------------------

  let eraserRafPending = false;
  let lastEraserEvent: PointerEvent | null = null;

  function handleEraserPointerDown(event: PointerEvent) {
    if (tool.value !== "eraser") {
      return;
    }
    if (isPalmRejected(event)) {
      return;
    }
    erasing = true;
    lastEraserEvent = event;
    if (!eraserRafPending) {
      eraserRafPending = true;
      requestAnimationFrame(flushErase);
    }
  }

  function handleEraserPointerMove(event: PointerEvent) {
    if (!erasing || tool.value !== "eraser") {
      return;
    }
    lastEraserEvent = event;
    if (!eraserRafPending) {
      eraserRafPending = true;
      requestAnimationFrame(flushErase);
    }
  }

  function handleEraserPointerUp() {
    erasing = false;
    lastEraserEvent = null;
  }

  function flushErase() {
    eraserRafPending = false;
    const event = lastEraserEvent;
    lastEraserEvent = null;
    if (!event) {
      return;
    }

    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }

    const point = canvas.getScenePoint(event);
    // Use containsPoint for a lightweight hit-check instead of
    // canvas.findTarget() which runs the full Fabric event-dispatch pipeline.
    const targets = canvas.getObjects().filter((obj) => obj.containsPoint(point));
    if (targets.length === 0) {
      return;
    }

    for (const target of targets) {
      canvas.remove(target);
      pushHistory({ type: "remove", object: target });
    }
    canvas.requestRenderAll();
  }

  // function handleEraserPointer(event: PointerEvent) {
  //   if (tool.value !== "eraser") {
  //     return;
  //   }
  //   if (isPalmRejected(event)) {
  //     return;
  //   }
  //   lastEraserEvent = event;
  //   if (!eraserRafPending) {
  //     eraserRafPending = true;
  //     requestAnimationFrame(flushErase);
  //   }
  // }

  // ---------------------------------------------------------------------------
  // Centralised object flag applicator — called on tool change and object:added
  // so selectable/evented are always consistent regardless of which path added
  // the object.
  // ---------------------------------------------------------------------------

  function applyToolFlags(canvas: Canvas) {
    const isSelect = tool.value === "select";
    const isEraser = tool.value === "eraser";
    canvas.forEachObject((obj) => {
      obj.selectable = isSelect;
      obj.evented = isSelect || isEraser;
    });
  }

  // ---------------------------------------------------------------------------
  // Shapes / text / images
  // ---------------------------------------------------------------------------

  function getViewportCenter(canvas: Canvas): { x: number; y: number } {
    // Fabric's wrapperEl is the div.canvas-container it creates around the
    // <canvas>; its parent is our scrollable .note-canvas__scroll wrapper.
    const scrollEl = canvas.wrapperEl?.parentElement;
    if (!scrollEl) {
      return canvas.getVpCenter();
    }
    const zoom = canvas.getZoom() || 1;
    return {
      x: (scrollEl.scrollLeft + scrollEl.clientWidth / 2) / zoom,
      y: (scrollEl.scrollTop + scrollEl.clientHeight / 2) / zoom,
    };
  }

  function addShape(kind: ShapeTool, color: string) {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }
    const center = getViewportCenter(canvas);
    const common = {
      left: center.x - 60,
      top: center.y - 40,
      stroke: color,
      fill: "transparent",
      strokeWidth: 2,
    };

    const shape: FabricObject = (() => {
      switch (kind) {
        case "rectangle": {
          return new Rect({ ...common, width: 120, height: 80 });
        }
        case "ellipse": {
          return new Ellipse({ ...common, rx: 60, ry: 40 });
        }
        case "line":
        case "arrow": {
          return new Line([center.x - 60, center.y, center.x + 60, center.y], {
            stroke: color,
            strokeWidth: 2,
          });
        }
      }
    })();

    canvas.add(shape);
    canvas.setActiveObject(shape);
    pushHistory({ type: "add", object: shape });

    // Auto-return to select mode so the new shape is immediately draggable —
    // this triggers applyToolFlags() via the tool watcher below.
    tool.value = "select";

    canvas.requestRenderAll();
  }

  function addText() {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }
    const center = getViewportCenter(canvas);
    const textbox = new Textbox("Text", {
      left: center.x - 60,
      top: center.y - 20,
      width: 160,
      fontSize: 20,
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    pushHistory({ type: "add", object: textbox });

    tool.value = "select";

    canvas.requestRenderAll();
    tool.value = "select";

    canvas.requestRenderAll();
  }

  async function addImage(file: File): Promise<void> {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }

    // URL.createObjectURL avoids base64-encoding the entire file in memory
    // (the old FileReader approach doubled peak memory usage for large images).
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await FabricImage.fromURL(objectUrl);
      img.scaleToWidth(Math.min(img.width ?? 300, 400));
      canvas.add(img);
      canvas.setActiveObject(img);
      pushHistory({ type: "add", object: img });

      const bounds = img.getBoundingRect();
      maxContentBottom = Math.max(maxContentBottom, bounds.top + bounds.height);
      growCanvasIfNeeded();
      canvas.requestRenderAll();
    } finally {
      // Always revoke — even if fromURL throws — to avoid memory leaks.
      URL.revokeObjectURL(objectUrl);
    }
  }

  // ---------------------------------------------------------------------------
  // Tool switching side effects
  // ---------------------------------------------------------------------------

  watch(tool, (value) => {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return;
    }

    canvas.selection = value === "select";
    // Skip Fabric's full hit-test pipeline while the pen tool is active —
    // we handle all pointer events ourselves.
    canvas.skipTargetFind = value === "pen";

    applyToolFlags(canvas);
    canvas.discardActiveObject();
    // Single render pass after all flag mutations.
    canvas.requestRenderAll();
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  function init(el: HTMLCanvasElement) {
    // Measure the wrapper, not the canvas itself — the canvas has a 300px
    // browser-default intrinsic size that can be read before CSS lays out
    // the flex parent.
    const wrapper = el.parentElement;
    const initialWidth = wrapper?.clientWidth || el.clientWidth || 300;

    const canvas = new Canvas(el, {
      height: CANVAS_MIN_HEIGHT,
      width: initialWidth,
      backgroundColor: backgroundColor.value,
      selection: false,
      enableRetinaScaling: true,
    });
    fabricCanvas.value = canvas;

    overlayCtx = canvas.contextTop; // use Fabric's own reference, not a fresh getContext() call

    const interactiveEl = canvas.upperCanvasEl;
    interactiveEl.style.touchAction = "none";

    interactiveEl.addEventListener("pointerdown", (e) => {
      handlePointerDown(e);
      // handleEraserPointer(e);
    });
    interactiveEl.addEventListener("pointermove", (e) => {
      handlePointerMove(e);
      // handleEraserPointer(e);
    });
    interactiveEl.addEventListener("pointerup", handlePointerUp);
    interactiveEl.addEventListener("pointercancel", handlePointerUp);

    interactiveEl.addEventListener("pointerdown", (e) => {
      handlePointerDown(e);
      handleEraserPointerDown(e);
    });
    interactiveEl.addEventListener("pointermove", (e) => {
      handlePointerMove(e);
      handleEraserPointerMove(e);
    });
    interactiveEl.addEventListener("pointerup", (e) => {
      handlePointerUp(e);
      handleEraserPointerUp();
    });
    interactiveEl.addEventListener("pointercancel", (e) => {
      handlePointerUp(e);
      handleEraserPointerUp();
    });

    canvas.on("object:added", () => applyToolFlags(canvas));

    // Keep the canvas width in sync with its container on every resize —
    // this is what was missing and caused the squished-left layout.
    if (wrapper) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        const newWidth = entry.contentRect.width;
        if (newWidth > 0 && Math.abs(newWidth - canvas.getWidth()) > 1) {
          canvas.setDimensions({ width: newWidth });
          canvas.requestRenderAll();
        }
      });
      resizeObserver.observe(wrapper);
    }
  }

  function loadFromJSON(json: Record<string, unknown> | null, bgColor: string): Promise<void> {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return Promise.resolve();
    }

    backgroundColor.value = bgColor;
    canvas.backgroundColor = bgColor;

    if (!json) {
      return Promise.resolve();
    }

    // Reset stacks BEFORE loading so any object:added events fired during
    // deserialization can't pollute the history.
    suppressHistory = true;
    undoStack = [];
    redoStack = [];
    maxContentBottom = 0;
    refreshHistoryFlags();

    return canvas.loadFromJSON(json).then(() => {
      canvas.requestRenderAll();
      suppressHistory = false;
    });
  }

  function toJSON(): Record<string, unknown> | null {
    return fabricCanvas.value?.toJSON() ?? null;
  }

  function generateThumbnail(): string | null {
    const canvas = fabricCanvas.value;
    if (!canvas) {
      return null;
    }
    return canvas.toDataURL({ format: "png", multiplier: 0.2, quality: 0.6 });
  }

  onBeforeUnmount(() => {
    stopPreviewLoop();
    resizeObserver?.disconnect();
    fabricCanvas.value?.dispose();
    overlayCtx = null;
  });

  return {
    addImage,
    addShape,
    addText,
    backgroundColor,
    canRedo,
    canUndo,
    fabricCanvas,
    generateThumbnail,
    init,
    loadFromJSON,
    penColor,
    penTool,
    redo,
    shapeTool,
    tool,
    toJSON,
    undo,
  };
}
