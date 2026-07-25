// src/utils/debounce.ts

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  // Cancels a pending call without running it.
  cancel(): void;
  // Runs a pending call immediately (if one is scheduled) instead of
  // waiting for the delay to elapse. Needed before the page can actually
  // unload/reload — a pending setTimeout is otherwise discarded along
  // with the JS context, silently dropping the write.
  flush(): void;
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): DebouncedFunction<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: Args | undefined;

  const debounced = ((...args: Args) => {
    pendingArgs = args;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      const argsToRun = pendingArgs;
      pendingArgs = undefined;
      if (argsToRun) {
        fn(...argsToRun);
      }
    }, delayMs);
  }) as DebouncedFunction<Args>;

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
    pendingArgs = undefined;
  };

  debounced.flush = () => {
    if (timeoutId === undefined || pendingArgs === undefined) {
      return;
    }
    clearTimeout(timeoutId);
    timeoutId = undefined;
    const argsToRun = pendingArgs;
    pendingArgs = undefined;
    fn(...argsToRun);
  };

  return debounced;
}
