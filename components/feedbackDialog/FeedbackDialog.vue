<template>
  <div>
    <Drawer
      v-model:visible="headerStore.showFeedback"
      position="right"
      :modal="true"
      :dismissable="true"
      class="!w-full !max-w-[768px] h-full rounded-none md:rounded-l-3xl"
      header="Have some suggestions?"
    >
      <div class="flex flex-col h-full">
        <!-- Content -->
        <div class="w-full rounded-3xl bg-rose-700 dark:bg-rose-900 p-4">
          <Form
            :validation-schema="schema"
            @submit="onSubmit"
            class="flex flex-col"
          >
            <div class="custom-panel-header rounded-xl p-2">
              <div class="flex items-center justify-between">
                <label for="name" class="block font-medium mb-1">Name</label>
                <ErrorMessage name="name" class="text-red-500 text-sm mt-1" />
              </div>

              <Field
                name="name"
                type="text"
                id="name"
                class="w-full p-inputtext !rounded-xl"
              />
            </div>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <div class="custom-panel-header rounded-xl p-2">
              <div class="flex items-center justify-between">
                <label for="email" class="block font-medium mb-1">Email</label>
                <ErrorMessage name="email" class="text-red-500 text-sm mt-1" />
              </div>

              <Field
                name="email"
                type="email"
                id="email"
                class="w-full p-inputtext !rounded-xl"
              />
            </div>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <div class="custom-panel-header rounded-xl p-2">
              <div class="flex items-center justify-between">
                <label for="message" class="block font-medium mb-1"
                  >Message</label
                >
                <ErrorMessage
                  name="message"
                  class="text-red-500 text-sm mt-1"
                />
              </div>

              <Field
                as="textarea"
                name="message"
                id="message"
                rows="5"
                class="w-full p-inputtextarea !rounded-xl resize-none"
              />
            </div>

            <div class="mx-2 my-1 p-0 max-w-full h-[1.5px] bg-black"></div>

            <div class="flex items-center gap-x-5">
              <Button
                type="reset"
                class="!rounded-xl px-4 py-2 flex-grow-1 flex items-center gap-x-2 text-sm sm:text-base lg:text-lg"
                :outlined="true"
                @click="closeFeedbackDialogHandle"
                ><X :size="16" /><span>Cancel</span>
              </Button>
              <Button
                type="submit"
                class="!rounded-xl px-4 py-2 flex-grow-1 flex items-center gap-x-2 text-sm sm:text-base lg:text-lg"
                ><Send :size="16" /><span>Submit</span>
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { useHeaderStore } from "@/stores/headerStore";
import { Send, X } from "lucide-vue-next";
import Button from "primevue/button";
import Drawer from "primevue/drawer";

// Vee-Validate
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";

const headerStore = useHeaderStore();

const closeFeedbackDialogHandle = () => {
  headerStore.showFeedback = false;
  headerStore.showSideMenu = true;
};

const schema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  message: yup
    .string()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(250, "Message can be at most 250 characters long"),
});

const onSubmit = (values: any) => {
  console.log("Feedback submitted:", values);
  // You can add logic here to send to an API or display a toast
};
</script>

<style scoped>
/* PrimeVue input style tweaks if needed */
.p-inputtext,
.p-inputtextarea {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem;
}
</style>
