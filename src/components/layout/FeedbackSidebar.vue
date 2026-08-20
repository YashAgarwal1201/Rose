<template>
  <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
    enter-to-class="opacity-100" leave-active-class="transition-opacity duration-300" leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" @click="close" aria-hidden="true"></div>
  </Transition>

  <Transition enter-active-class="transition-transform duration-300 ease-in-out" enter-from-class="translate-x-full"
    enter-to-class="translate-x-0" leave-active-class="transition-transform duration-300 ease-in-out"
    leave-from-class="translate-x-0" leave-to-class="translate-x-full">
    <div v-if="isOpen" ref="sidebarRef" @keydown.escape="close"
      class="fixed top-0 right-0 h-full z-50 w-full max-w-3xl rounded-none md:rounded-l-xl! bg-rose-bg shadow-2xl flex flex-col border-l border-rose-border">

      <div class="flex items-center justify-between p-5 shrink-0">
        <h3 class="text-lg sm:text-xl md:text-2xl font-semibold text-rose-text">Let's connect</h3>
        <button
          class="p-2 hover:bg-rose-surface-alt rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-primary"
          @click="close" aria-label="Close sidebar">
          <XIcon class="w-5 h-5 text-rose-text" />
        </button>
      </div>

      <div class="grow overflow-y-auto px-5 pb-5">
        <div class="p-4 rounded-xl bg-rose-surface-alt border border-rose-border overflow-hidden">
          <form @submit.prevent="submit" class="flex flex-col gap-6">

            <!-- Name Field -->
            <div class="flex flex-col gap-2">
              <label class="text-lg font-semibold text-rose-text flex items-center gap-2">
                <UserIcon class="w-4 h-4 text-rose-text-muted" />
                Name <span class="text-rose-primary">*</span>
              </label>
              <input v-model="name" type="text" placeholder="e.g. Boba Fett"
                class="w-full bg-rose-surface border rounded-xl px-4 py-3 text-rose-text placeholder-rose-text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-rose-primary transition-all"
                :class="nameError ? 'border-red-500' : 'border-rose-border'" />
              <span v-if="nameError" class="text-xs text-red-500">{{ nameError }}</span>
            </div>
            <div class="divider" />
            <!-- Email Field -->
            <div class="flex flex-col gap-2">
              <label class="text-lg font-semibold text-rose-text flex items-center gap-2">
                <MailIcon class="w-4 h-4 text-rose-text-muted" />
                Email Address <span class="text-rose-primary">*</span>
              </label>
              <input v-model="email" type="email" placeholder="e.g. boba.fett@bountyhunter.com"
                class="w-full bg-rose-surface border rounded-xl px-4 py-3 text-rose-text placeholder-rose-text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-rose-primary transition-all"
                :class="emailError ? 'border-red-500' : 'border-rose-border'" />
              <span v-if="emailError" class="text-xs text-red-500">{{ emailError }}</span>
            </div>
            <div class="divider" />
            <!-- Message Field -->
            <div class="flex flex-col gap-2">
              <label class="text-lg font-semibold text-rose-text flex items-center gap-2">
                <PencilIcon class="w-4 h-4 text-rose-text-muted" />
                Message <span class="text-rose-primary">*</span>
              </label>
              <textarea v-model="message" placeholder="e.g. Jabba ruled with fear. I intend to rule with respect."
                rows="5"
                class="w-full bg-rose-surface border rounded-xl px-4 py-3 text-rose-text placeholder-rose-text-muted/50 focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-rose-primary transition-all resize-none"
                :class="messageError ? 'border-red-500' : 'border-rose-border'"></textarea>
              <span v-if="messageError" class="text-xs text-red-500">{{ messageError }}</span>
            </div>

            <div class="divider" />

            <!-- Actions -->
            <div class="gap-3 grid grid-cols-2">
              <button type="button" @click="close"
                class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-border bg-transparent text-rose-text font-medium hover:bg-rose-surface-alt transition-colors focus:outline-none focus:ring-2 focus:ring-rose-primary">
                <X class="w-4 h-4" />
                Cancel
              </button>
              <button type="submit" :disabled="isSubmitting"
                class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-primary text-white font-medium hover:bg-rose-primary-hover transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-primary disabled:opacity-70 disabled:cursor-not-allowed">
                <LoaderIcon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                <SendIcon v-else class="w-4 h-4" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { LoaderIcon, MailIcon, PencilIcon, SendIcon, UserIcon, X, XIcon } from "@lucide/vue";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";
import { z } from "zod";
import { useField, useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";

const { isOpen } = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: []; cancel: [] }>();

const sidebarRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(sidebarRef, { escapeDeactivates: false });

watch(() => isOpen, (val) => {
  if (val) {
    nextTick().then(() => activate());
  } else {
    deactivate();
    resetForm();
  }
});

const schema = toTypedSchema(z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
}));

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: "",
    email: "",
    message: "",
  },
});

const { value: name, errorMessage: nameError } = useField<string>("name");
const { value: email, errorMessage: emailError } = useField<string>("email");
const { value: message, errorMessage: messageError } = useField<string>("message");

const submit = handleSubmit((values) => {
  // Simulate network delay for animation effect
  setTimeout(() => {
    const targetEmail = import.meta.env.VITE_FEEDBACK_EMAIL || "support@rose-app.com";
    const subject = encodeURIComponent(`App Feedback from ${values.name}`);
    const body = encodeURIComponent(`Name: ${values.name}\nEmail: ${values.email}\n\nMessage:\n${values.message}`);

    globalThis.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

    emit("close");
  }, 600);
});

function close() {
  emit("cancel");
}
</script>
