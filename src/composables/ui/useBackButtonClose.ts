// src/composables/useBackButtonClose.ts
import { type Ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useBackButtonClose(
  isOpen: Ref<boolean>,
  hashName: string,
  close: () => void,
  open?: () => void
) {
  const router = useRouter();
  const route = useRoute();

  let isInternalChange = false;

  // Watch the open state of the modal
  watch(isOpen, async (newVal) => {
    if (isInternalChange) {return;}

    if (newVal) {
      // Modal opened: Push hash to URL
      if (route.hash !== `#${hashName}`) {
        isInternalChange = true;
        await router.push({ hash: `#${hashName}` });
        isInternalChange = false;
      }
    } else {
      // Modal closed programmatically: pop the hash if it's ours
      if (route.hash === `#${hashName}`) {
        isInternalChange = true;
        router.back();
        // Give router time to process the back navigation before accepting new changes
        setTimeout(() => {
          isInternalChange = false;
        }, 50);
      }
    }
  });

  // Watch the route hash for back/forward button presses
  watch(
    () => route.hash,
    (newHash) => {
      if (isInternalChange) {return;}

      if (isOpen.value && newHash !== `#${hashName}`) {
        // Navigated away (e.g. Back button)
        isInternalChange = true;
        close();
        // Reset flag
        setTimeout(() => {
          isInternalChange = false;
        }, 50);
      } else if (!isOpen.value && newHash === `#${hashName}`) {
        // User navigated FORWARD into the hash, but the modal is closed!
        if (open) {
          // Re-open the modal seamlessly (e.g., for Menu or Search)
          isInternalChange = true;
          open();
          setTimeout(() => {
            isInternalChange = false;
          }, 50);
        } else {
          // We cannot safely reopen this modal (e.g., Confirm/Input dialogs),
          // so we bounce them back immediately to consume the forward action and repair the URL.
          isInternalChange = true;
          router.back();
          setTimeout(() => {
            isInternalChange = false;
          }, 50);
        }
      }
    }
  );
}
