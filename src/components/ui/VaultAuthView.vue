<template>
  <div class="flex h-full w-full flex-col overflow-y-auto p-4 md:p-8 text-center text-rose-text">
    <div class="m-auto flex w-full max-w-md flex-col items-center justify-center py-2 md:py-4 shrink-0">
      <img :src="SecureFolderIllustration" alt="Secure Vault"
        class="w-24 md:w-48 h-auto mb-2 md:mb-6 opacity-80 select-none pointer-events-none shrink-0" />
      <h1 class="mb-1 md:mb-2 text-2xl md:text-3xl font-bold tracking-tight">Secure Vault</h1>

      <div v-if="!vaultStore.isSetup && setupPhase === 'initial'" class="max-w-md w-full">
        <p class="mb-3 md:mb-6 text-sm md:text-base text-rose-text-muted">
          Please create a Master PIN to protect your vault.
        </p>

        <form @submit.prevent="handleSetup" class="space-y-3 md:space-y-4">
          <!-- Hidden username to help password managers -->
          <input type="text" name="username" id="setup-username" autocomplete="username" class="hidden"
            value="RoseVault" />
          <div>
            <label for="new-pin" class="mb-1 block text-sm font-medium text-left">Master PIN</label>
            <input v-model="pin" id="new-pin" name="new-password" autocomplete="new-password" type="password" required
              class="w-full rounded-md border border-rose-border bg-rose-surface text-rose-text px-3 py-1.5 md:px-4 md:py-2 focus:border-rose-primary focus:ring-1 focus:ring-rose-primary placeholder:text-rose-text-muted"
              placeholder="Enter a secure PIN" />
          </div>
          <div>
            <label for="confirm-pin" class="mb-1 block text-sm font-medium text-left">Confirm PIN</label>
            <input v-model="confirmPin" id="confirm-pin" name="confirm-password" autocomplete="new-password"
              type="password" required
              class="w-full rounded-md border border-rose-border bg-rose-surface text-rose-text px-3 py-1.5 md:px-4 md:py-2 focus:border-rose-primary focus:ring-1 focus:ring-rose-primary placeholder:text-rose-text-muted"
              placeholder="Re-enter your PIN" />
          </div>

          <div v-if="errorMsg" class="text-sm text-red-500 font-medium">{{ errorMsg }}</div>

          <button type="submit"
            class="w-full flex items-center justify-center gap-x-2 rounded-md bg-rose-primary px-4 py-2 font-medium text-white hover:bg-rose-primary-hover transition-colors">
            <Key :size="16" /> Generate Recovery Key
          </button>
        </form>
      </div>

      <div v-else-if="setupPhase === 'recovery'" class="max-w-md w-full">
        <div class="p-4 mb-6 rounded-md bg-amber-500/10 border border-amber-500/20 text-left">
          <h3 class="font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center">
            <AlertTriangleIcon class="w-5 h-5 mr-2" />
            Crucial: Save Your Recovery Key
          </h3>
          <p class="text-sm text-amber-700 dark:text-amber-500 mb-4">
            If you forget your PIN, this is the <strong>only</strong> way to recover your encrypted data. Copy it
            somewhere safe.
          </p>
          <div
            class="p-3 bg-rose-surface rounded border border-amber-500/30 font-mono text-center tracking-widest text-lg select-all text-rose-text">
            {{ generatedRecoveryKey }}
          </div>
        </div>
        <button @click="finishSetup"
          class="w-full rounded-md bg-rose-primary px-4 py-2 font-medium text-white hover:bg-rose-primary-hover transition-colors">
          I have saved my Recovery Key
        </button>
      </div>

      <div v-else class="max-w-sm w-full">
        <p class="mb-3 md:mb-6 text-sm md:text-base text-rose-text-muted">
          {{ promptMessage || "Enter your PIN to unlock this item." }}
        </p>

        <form @submit.prevent="handleUnlock" class="space-y-4">
          <!-- Hidden username to help password managers -->
          <input type="text" name="username" id="unlock-username" autocomplete="username" class="hidden"
            value="RoseVault" />
          <input v-model="pin" id="pin" name="password" autocomplete="current-password" type="password" required
            autofocus
            class="w-full rounded-md border border-rose-border bg-rose-surface text-rose-text px-4 py-2 md:py-3 text-center text-xl tracking-[0.5em] focus:border-rose-primary focus:ring-1 focus:ring-rose-primary placeholder:text-rose-text-muted"
            placeholder="••••" />

          <div v-if="errorMsg" class="text-sm text-red-500 font-medium">{{ errorMsg }}</div>

          <button type="submit"
            class="w-full rounded-md bg-rose-primary px-4 py-1.5 md:py-2 text-sm md:text-base font-medium text-white hover:bg-rose-primary-hover transition-colors">
            Unlock
          </button>
        </form>

        <button @click="showRecoveryMode = !showRecoveryMode"
          class="mt-3 md:mt-6 text-sm text-rose-text-muted hover:text-rose-primary transition-colors">
          Forgot PIN?
        </button>

        <div v-if="showRecoveryMode" class="mt-4 p-4 border border-rose-border bg-rose-surface-alt rounded-md">
          <p class="text-sm mb-2 text-left text-rose-text">Enter your Recovery Key to reset your PIN:</p>
          <input v-model="recoveryInput" type="text"
            class="w-full rounded-md border border-rose-border bg-rose-surface text-rose-text px-3 py-2 text-sm mb-3 font-mono uppercase focus:border-rose-primary focus:ring-1 focus:ring-rose-primary placeholder:text-rose-text-muted"
            placeholder="XXXX-XXXX-XXXX-XXXX" />
          <input v-model="newPinInput" type="password"
            class="w-full rounded-md border border-rose-border bg-rose-surface text-rose-text px-3 py-2 text-sm mb-3 focus:border-rose-primary focus:ring-1 focus:ring-rose-primary placeholder:text-rose-text-muted"
            placeholder="Enter new PIN" />
          <button @click="handleRecover"
            class="w-full rounded-md bg-rose-primary text-white px-4 py-1.5 text-sm font-medium hover:bg-rose-primary-hover transition-colors">
            Recover Vault
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { AlertTriangleIcon, Key } from "@lucide/vue";
import SecureFolderIllustration from "@/assets/illustrations/secure-folder.svg";
import { useVaultStore } from "@/stores/vault";
import { generateRecoveryKey } from "@/utils/crypto";

defineProps<{
  promptMessage?: string;
}>();

const emit = defineEmits<{
  (e: "unlocked"): void;
}>();

const vaultStore = useVaultStore();

const pin = ref("");
const confirmPin = ref("");
const errorMsg = ref("");

const setupPhase = ref<"initial" | "recovery">("initial");
const generatedRecoveryKey = ref("");

const showRecoveryMode = ref(false);
const recoveryInput = ref("");
const newPinInput = ref("");

async function handleSetup() {
  errorMsg.value = "";
  if (pin.value !== confirmPin.value) {
    errorMsg.value = "PINs do not match.";
    return;
  }
  if (pin.value.length < 4) {
    errorMsg.value = "PIN must be at least 4 characters.";
    return;
  }
  generatedRecoveryKey.value = generateRecoveryKey();
  setupPhase.value = "recovery";
}

async function finishSetup() {
  await vaultStore.setupVault(pin.value, generatedRecoveryKey.value);
  emit("unlocked");
}

async function handleUnlock() {
  errorMsg.value = "";
  const success = await vaultStore.unlockVault(pin.value);
  if (success) {
    emit("unlocked");
  } else {
    errorMsg.value = "Incorrect PIN.";
    pin.value = "";
  }
}

async function handleRecover() {
  errorMsg.value = "";
  if (newPinInput.value.length < 4) {
    errorMsg.value = "New PIN must be at least 4 characters.";
    return;
  }
  const success = await vaultStore.unlockWithRecoveryKey(recoveryInput.value, newPinInput.value);
  if (success) {
    emit("unlocked");
  } else {
    errorMsg.value = "Incorrect Recovery Key.";
  }
}
</script>
