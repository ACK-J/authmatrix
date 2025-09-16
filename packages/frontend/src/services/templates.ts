import { defineStore } from "pinia";
import type { TemplateDTO } from "shared";

import { useSDK } from "@/plugins/sdk";
import { useTemplateRepository } from "@/repositories/templates";
import { useAnalysisStore } from "@/stores/analysis";
import { useTemplateStore } from "@/stores/templates";

export const useTemplateService = defineStore("services.templates", () => {
  const sdk = useSDK();
  const repository = useTemplateRepository();
  const store = useTemplateStore();

  const toggleTemplateRole = async (templateId: string, roleId: string) => {
    const result = await repository.toggleTemplateRole(templateId, roleId);

    if (result.type === "Ok") {
      store.send({ type: "UpdateTemplate", template: result.template });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const toggleTemplateUser = async (templateId: string, userId: string) => {
    const result = await repository.toggleTemplateUser(templateId, userId);

    if (result.type === "Ok") {
      store.send({ type: "UpdateTemplate", template: result.template });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const addTemplate = async () => {
    const result = await repository.addTemplate();

    if (result.type === "Ok") {
      store.send({ type: "AddTemplate", template: result.template });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const updateTemplate = async (
    id: string,
    fields: Omit<TemplateDTO, "id">,
  ) => {
    const result = await repository.updateTemplate(id, fields);

    if (result.type === "Ok") {
      store.send({ type: "UpdateTemplate", template: result.template });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const analysisStore = useAnalysisStore();
  const deleteTemplate = async (id: string) => {
    const result = await repository.deleteTemplate(id);

    if (result.type === "Ok") {
      store.send({ type: "DeleteTemplate", id });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const clearTemplates = async () => {
    const result = await repository.clearTemplates();
    if (result.type === "Ok") {
      store.send({ type: "ClearTemplates" });
      analysisStore.selectionState.send({ type: "Reset" });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const importOpenApi = async (fileContents: string) => {
    const result = await repository.importOpenApi(fileContents);
    if (result.type === "Ok") {
      sdk.window.showToast(`Imported ${result.templates.length} templates`, {
        variant: "success",
      });
      // templates:created events from backend will populate the store; no further action required.
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
    return result;
  };

  return {
    getState: store.getState,
    initialize: store.initialize,
    toggleTemplateRole,
    toggleTemplateUser,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    clearTemplates,
    importOpenApi,
  };
});
