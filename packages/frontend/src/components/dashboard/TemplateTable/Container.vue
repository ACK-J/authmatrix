<template>
  <div>
    <!-- existing template content retained above/below this snippet in the real file -->
    <div class="flex items-end gap-4">
      <div class="flex flex-col gap-2">
        <div
          v-tooltip="
            'Check this box if you want analysis to automatically run in the background.'
          "
          class="flex items-center gap-2"
        >
          <Checkbox
            input-id="auto-analysis"
            :model-value="settingsState.settings.autoRunAnalysis"
            binary
            @change="() => settingsService.toggleAutoRunAnalysis()"
          />
          <label for="auto-analysis" class="text-sm text-gray-400"
            >Auto-run analysis</label
          >
        </div>
        <label class="text-sm text-gray-400">Auto-capture requests</label>
        <SelectButton
          v-tooltip="
            'Automatically add each intercepted request to the testing queue for analysis.'
          "
          <!-- existing props -->
        />
      </div>

      <!-- New import OpenAPI button and hidden file input -->
      <div class="flex items-center gap-2">
        <input
          ref="openapiInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="onFileSelected"
        />
        <button
          class="px-3 py-2 bg-blue-600 text-white rounded text-sm"
          @click="() => openapiInput && openapiInput.click()"
        >
          Import OpenAPI (JSON)
        </button>
      </div>
    </div>
    <!-- rest of component -->
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTemplateService } from "@/services/templates";
import { useSettingsService } from "@/services/settings";

const templateService = useTemplateService();
const settingsService = useSettingsService();

const openapiInput = ref<HTMLInputElement | null>(null);

const onFileSelected = async (ev: Event) => {
  const input = ev.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  try {
    const text = await file.text();
    await templateService.importOpenApi(text);
  } catch (e) {
    // service shows toasts; nothing else to do here.
  } finally {
    // clear selection so same file can be re-selected later
    if (openapiInput.value) openapiInput.value.value = "";
  }
};
</script>

<style scoped>
/* keep existing styles */
</style>
