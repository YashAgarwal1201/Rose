// src/stores/vault.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "../db";
import { deriveAesKey, generateSalt, hashString } from "../utils/crypto";

export const useVaultStore = defineStore("vault", () => {
  const isUnlocked = ref(false);
  const derivedKey = ref<CryptoKey | null>(null);
  const isSetup = ref(false);

  let lockTimeout: number | null = null;
  const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  async function checkSetup() {
    const settings = await db.settings.get(1);
    isSetup.value = !!(settings?.vaultPinHash && settings?.vaultPinSalt);
  }

  function resetLockTimer() {
    if (lockTimeout) clearTimeout(lockTimeout);
    if (isUnlocked.value) {
      lockTimeout = window.setTimeout(() => {
        lockVault();
      }, LOCK_TIMEOUT_MS);
    }
  }

  function setupActivityListeners() {
    window.addEventListener("mousemove", resetLockTimer);
    window.addEventListener("keydown", resetLockTimer);
    window.addEventListener("touchstart", resetLockTimer);
  }

  function cleanupActivityListeners() {
    window.removeEventListener("mousemove", resetLockTimer);
    window.removeEventListener("keydown", resetLockTimer);
    window.removeEventListener("touchstart", resetLockTimer);
    if (lockTimeout) clearTimeout(lockTimeout);
  }

  async function setupVault(pin: string, recoveryKey: string) {
    const salt = generateSalt();
    const pinHash = await hashString(pin);
    const recoveryHash = await hashString(recoveryKey);

    const settings = await db.settings.get(1);
    if (settings) {
      await db.settings.update(1, {
        vaultPinSalt: salt,
        vaultPinHash: pinHash,
        vaultRecoveryHash: recoveryHash,
      });
    }

    derivedKey.value = await deriveAesKey(pin, salt);
    isUnlocked.value = true;
    isSetup.value = true;
    setupActivityListeners();
    resetLockTimer();
  }

  async function unlockVault(pin: string): Promise<boolean> {
    const settings = await db.settings.get(1);
    if (!settings || !settings.vaultPinHash || !settings.vaultPinSalt) return false;

    const pinHash = await hashString(pin);
    if (pinHash !== settings.vaultPinHash) return false;

    derivedKey.value = await deriveAesKey(pin, settings.vaultPinSalt);
    isUnlocked.value = true;
    setupActivityListeners();
    resetLockTimer();
    return true;
  }

  async function unlockWithRecoveryKey(recoveryKey: string, newPin: string): Promise<boolean> {
    const settings = await db.settings.get(1);
    if (!settings || !settings.vaultRecoveryHash) return false;

    const inputRecoveryHash = await hashString(recoveryKey);
    if (inputRecoveryHash !== settings.vaultRecoveryHash) return false;

    // Reset with new PIN
    await setupVault(newPin, recoveryKey); // keep same recovery key, or we could generate a new one
    return true;
  }

  function lockVault() {
    derivedKey.value = null;
    isUnlocked.value = false;
    cleanupActivityListeners();
  }

  // Initialize
  checkSetup();

  return {
    isUnlocked,
    derivedKey,
    isSetup,
    checkSetup,
    setupVault,
    unlockVault,
    unlockWithRecoveryKey,
    lockVault,
  };
});
