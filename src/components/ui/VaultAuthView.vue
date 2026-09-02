<template>
  <div class="flex h-full w-full flex-col items-center justify-center p-8 text-center text-slate-800 dark:text-slate-200">
    <LockIcon class="mb-6 h-16 w-16 text-rose-500" />
    <h1 class="mb-2 text-3xl font-bold tracking-tight">Secure Vault</h1>
    
    <div v-if="!vaultStore.isSetup && setupPhase === 'initial'" class="max-w-md w-full">
      <p class="mb-6 text-slate-500 dark:text-slate-400">
        Welcome to your Secure Vault. Items moved here are fully encrypted. Please create a Master PIN to protect your vault.
      </p>
      
      <form @submit.prevent="handleSetup" class="space-y-4">
        <!-- Hidden username to help password managers -->
        <input type="text" name="username" id="setup-username" autocomplete="username" class="hidden" value="RoseVault" />
        <div>
          <label for="new-pin" class="mb-1 block text-sm font-medium text-left">Master PIN</label>
          <input
            v-model="pin"
            id="new-pin"
            name="new-password"
            autocomplete="new-password"
            type="password"
            required
            class="w-full rounded-md border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            placeholder="Enter a secure PIN"
          />
        </div>
        <div>
          <label for="confirm-pin" class="mb-1 block text-sm font-medium text-left">Confirm PIN</label>
          <input
            v-model="confirmPin"
            id="confirm-pin"
            name="confirm-password"
            autocomplete="new-password"
            type="password"
            required
            class="w-full rounded-md border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            placeholder="Re-enter your PIN"
          />
        </div>

        <div v-if="errorMsg" class="text-sm text-red-500 font-medium">{{ errorMsg }}</div>

        <button
          type="submit"
          class="w-full rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 transition-colors"
        >
          Generate Recovery Key
        </button>
      </form>
    </div>

    <div v-else-if="setupPhase === 'recovery'" class="max-w-md w-full">
      <div class="p-4 mb-6 rounded-md bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-left">
        <h3 class="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center">
          <AlertTriangleIcon class="w-5 h-5 mr-2" />
          Crucial: Save Your Recovery Key
        </h3>
        <p class="text-sm text-yellow-700 dark:text-yellow-500 mb-4">
          If you forget your PIN, this is the <strong>only</strong> way to recover your encrypted data. Copy it somewhere safe.
        </p>
        <div class="p-3 bg-white dark:bg-black rounded border border-yellow-300 dark:border-yellow-600 font-mono text-center tracking-widest text-lg select-all">
          {{ generatedRecoveryKey }}
        </div>
      </div>
      <button
        @click="finishSetup"
        class="w-full rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 transition-colors"
      >
        I have saved my Recovery Key
      </button>
    </div>

    <div v-else class="max-w-sm w-full">
      <p class="mb-6 text-slate-500 dark:text-slate-400">
        {{ promptMessage || "Enter your PIN to unlock this item." }}
      </p>

      <form @submit.prevent="handleUnlock" class="space-y-4">
        <!-- Hidden username to help password managers -->
        <input type="text" name="username" id="unlock-username" autocomplete="username" class="hidden" value="RoseVault" />
        <input
          v-model="pin"
          id="pin"
          name="password"
          autocomplete="current-password"
          type="password"
          required
          autofocus
          class="w-full rounded-md border border-slate-300 px-4 py-3 text-center text-xl tracking-[0.5em] dark:border-slate-700 dark:bg-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          placeholder="••••"
        />
        
        <div v-if="errorMsg" class="text-sm text-red-500 font-medium">{{ errorMsg }}</div>

        <button
          type="submit"
          class="w-full rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 transition-colors"
        >
          Unlock
        </button>
      </form>
      
      <button 
        @click="showRecoveryMode = !showRecoveryMode" 
        class="mt-6 text-sm text-slate-500 hover:text-rose-500 transition-colors"
      >
        Forgot PIN?
      </button>

      <div v-if="showRecoveryMode" class="mt-4 p-4 border rounded-md dark:border-slate-700">
        <p class="text-sm mb-2 text-left">Enter your Recovery Key to reset your PIN:</p>
        <input
          v-model="recoveryInput"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-3 font-mono dark:border-slate-700 dark:bg-slate-900 uppercase"
          placeholder="XXXX-XXXX-XXXX-XXXX"
        />
        <input
          v-model="newPinInput"
          type="password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-3 dark:border-slate-700 dark:bg-slate-900"
          placeholder="Enter new PIN"
        />
        <button
          @click="handleRecover"
          class="w-full rounded-md bg-slate-800 dark:bg-slate-200 text-white dark:text-black px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Recover Vault
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { LockIcon, AlertTriangleIcon } from "@lucide/vue";
import { useVaultStore } from "@/stores/vault";
import { generateRecoveryKey } from "@/utils/crypto";

const props = defineProps<{
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
