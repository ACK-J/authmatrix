import type { RoleDTO } from "shared";

export class RoleStore {
  private static _store?: RoleStore;

  private roles: Map<string, RoleDTO>;

  private constructor() {
    this.roles = new Map();
  }

  static get(): RoleStore {
    if (!RoleStore._store) {
      RoleStore._store = new RoleStore();
    }

    return RoleStore._store;
  }

  getRoles() {
    return [...this.roles.values()];
  }

  addRole(role: RoleDTO) {
    this.roles.set(role.id, role);
  }

  deleteRole(requestId: string) {
    this.roles.delete(requestId);
  }

  updateRole(id: string, fields: Omit<RoleDTO, "id">) {
    const role = this.roles.get(id);
    if (role) {
      Object.assign(role, fields);
      return role;
    }
  }

  clear() {
    this.roles.clear();
  }
}
