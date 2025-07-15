<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-6 font-content">
    <!-- <Steps :model="steps" :activeIndex="activeStep" class="mb-6" /> -->

    <!-- Step 1: Username -->
    <div
      v-if="activeStep === 0"
      class="w-full max-w-full h-full flex flex-col gap-4"
    >
      <h2 class="text-3xl font-heading">Hello there! User #{{ defaultId }}</h2>
      <p class="text-lg">
        Enter your name or continue as <strong>User #{{ defaultId }}</strong>
      </p>

      <div class="w-full max-w-2xl flex flex-col gap-y-4 m-auto">
        <InputText
          v-model="userName"
          class="!rounded-2xl"
          placeholder="Enter your name..."
          maxLenght="70"
          @keyup.enter="goToStep(1)"
        />
      </div>
      <Button label="Continue" @click="goToStep(1)" class="w-fit ml-auto" />
    </div>

    <!-- Step 2: Feature Selection -->
    <div
      v-else-if="activeStep === 1"
      class="w-full max-w-full h-full flex flex-col gap-4"
    >
      <h2 class="text-3xl font-heading">Choose Features</h2>
      <p class="text-lg">Select the features u want to use in your application</p>
      <div class="w-full max-w-2xl flex flex-col gap-y-4 m-auto">
        <div class="grid grid-cols-2 gap-3">
          <Button
            v-for="f in features"
            :key="f.value"
            :class="{
              '!bg-blue-600 text-white': selectedFeatures.includes(f.value), 'pointer-events-none': f.disabled,
            }"
            :disabled="f.disabled"
            class="!rounded-xl flex flex-col items-center gap-y-3 aspect-square max-w-36"
            @click="toggleFeature(f.value)"
          ><component :is="f.icon" :size="24" /><span>{{ f.label }}</span></Button>
        </div>
      </div>

      <div class="flex justify-between sm:justify-start items-center mt-6 ml-0 sm:ml-auto gap-x-5">
        <Button @click="goToStep(0)" variant="outlined" class="!rounded-xl flex items-center gap-x-2"><ArrowLeft :size="24" /><span>Go back</span> </Button>
        <Button
          @click="finishSetup"
          :disabled="selectedFeatures.length === 0"
          class="!rounded-xl flex flex-row-reverse items-center gap-x-2"
        ><ArrowRight :size="24" /><span>Finish setup</span> </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Steps from "primevue/steps";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { ArrowLeft, ArrowRight , ListTodo, FileText, Signature } from 'lucide-vue-next';

const router = useRouter();
const setupStore = useUserSetupStore();

const defaultId = new Date().getTime().toString().slice(-5); // Generate a default ID based on timestamp
const userName = ref("");
const selectedFeatures = ref<string[]>([]);
const activeStep = ref(0);

const steps = [{ label: "Username" }, { label: "Features" }];

const features = [
  { label: "To Do List", value: "todo", icon:  ListTodo, disabled: false },
  { label: "Docs Generator", value: "docs", icon: FileText, disabled: true },
  { label: "Sketch Notes", value: "sketch", icon: Signature, disabled: true },
];

function toggleFeature(value: string) {
  if (selectedFeatures.value.includes(value)) {
    selectedFeatures.value = selectedFeatures.value.filter((f) => f !== value);
  } else {
    selectedFeatures.value.push(value);
  }
}

function goToStep(step: number) {
  activeStep.value = step;
}

function finishSetup() {
  const nameToUse = userName.value.trim() || `User #${defaultId}`;
  setupStore.setUser(nameToUse);
  setupStore.setFeatures(selectedFeatures.value);
  router.push("/");
}

onMounted(() => {
  setupStore.loadFromStorage();
});
</script>


<style lang="css">
.aspect-square {
  aspect-ratio: 1 / 1;
}
</style>