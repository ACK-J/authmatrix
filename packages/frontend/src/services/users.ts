import { computed } from "vue";

import { useSDK } from "@/plugins/sdk";
import { useUserRepository } from "@/repositories/users";
import { useUserStore } from "@/stores/users";
import { defineStore } from "pinia";
import type { UserDTO } from "shared";

export const useUserService = defineStore("services.users", () => {
  const sdk = useSDK();
  const repository = useUserRepository();
  const store = useUserStore();

  const initialize = async () => {
    store.send({ type: "Start" });

    const result = await repository.getUsers();

    if (result.type === "Ok") {
      store.send({ type: "Success", users: result.users });
    } else {
      store.send({ type: "Error", error: result.error });
    }
  };

  const getState = () => store.getState();

  const addUser = async (name: string): Promise<UserDTO | undefined> => {
    const result = await repository.addUser(name);

    if (result.type === "Ok") {
      store.send({ type: "AddUser", user: result.user });
      return result.user;
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
      return undefined;
    }
  };

  const updateUser = async (id: string, fields: Omit<UserDTO, "id">) => {
    const result = await repository.updateUser(id, fields);

    if (result.type === "Ok") {
      store.send({ type: "UpdateUser", user: result.user });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const deleteUser = async (id: string) => {
    const result = await repository.deleteUser(id);

    if (result.type === "Ok") {
      store.send({ type: "DeleteUser", id });
    } else {
      sdk.window.showToast(result.error, {
        variant: "error",
      });
    }
  };

  const userSelection = computed({
    get: () => {
      const state = store.getState();
      switch (state.type) {
        case "Success":
          return state.users.find((user) => user.id === state.selectedUserId);
        default:
          return undefined;
      }
    },
    set: (user) => {
      store.send({ type: "SelectUser", id: user?.id });
    },
  });

  return {
    initialize,
    getState,
    addUser,
    updateUser,
    deleteUser,
    userSelection,
  };
});
