import type { SDK } from "caido:plugin";
import type { RoleDTO } from "shared";

import { RoleStore } from "../stores/roles";

export const getRoles = (sdk: SDK): RoleDTO[] => {
  const store = RoleStore.get();

  return store.getRoles();
};

export const addRole = (_sdk: SDK, name: string) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2);

  const role: RoleDTO = {
    id,
    name,
    description: "",
  };

  const store = RoleStore.get();
  store.addRole(role);

  return role;
};

export const deleteRole = (_sdk: SDK, id: string) => {
  const store = RoleStore.get();
  store.deleteRole(id);
};

export const updateRole = (
  _sdk: SDK,
  id: string,
  fields: Omit<RoleDTO, "id">,
) => {
  const store = RoleStore.get();
  return store.updateRole(id, fields);
};
