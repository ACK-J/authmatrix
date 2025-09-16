import type { SDK } from "caido:plugin";
import type { TemplateDTO } from "shared";

import { withProject } from "../db/utils";
import { createTemplate } from "../repositories/templates";
import { TemplateStore } from "../stores/templates";
import { generateID } from "../utils";
import type { BackendEvents } from "../types";

/**
 * Minimal OpenAPI / Swagger JSON importer.
 *
 * Notes:
 * - This is a conservative MVP: it only accepts JSON (not YAML) and supports
 *   OpenAPI 3.x (servers) and Swagger 2.0 (host/schemes/basePath).
 * - It does not resolve $ref or dereference remote files.
 * - For each operation it creates a TemplateDTO with minimal metadata so the
 *   frontend can display and the backend can persist it.
 */
export const importOpenApi = async (
  sdk: SDK<never, BackendEvents>,
  fileContents: string,
) => {
  let doc: any;
  try {
    doc = JSON.parse(fileContents);
  } catch (e) {
    throw new Error("Failed to parse JSON OpenAPI/Swagger file");
  }

  // Determine servers / host info
  const getServerInfo = (doc: any): { url?: string; host?: string; isTls?: boolean; port?: number } => {
    // OpenAPI 3.x: servers: [{ url: "https://example.com/base" }]
    if (Array.isArray(doc.servers) && doc.servers.length > 0 && typeof doc.servers[0].url === "string") {
      try {
        const u = new URL(doc.servers[0].url);
        return {
          url: doc.servers[0].url,
          host: u.hostname,
          isTls: u.protocol === "https:",
          port: u.port ? parseInt(u.port, 10) : (u.protocol === "https:" ? 443 : 80),
        };
      } catch {
        // ignore URL parse errors, fallthrough to swagger2
      }
    }

    // Swagger 2.0: host, schemes, basePath
    if (typeof doc.host === "string") {
      const scheme = Array.isArray(doc.schemes) && doc.schemes.length > 0 ? doc.schemes[0] : "http";
      return {
        host: doc.host,
        isTls: scheme === "https",
        port: scheme === "https" ? 443 : 80,
      };
    }

    return {};
  };

  const serverInfo = getServerInfo(doc);

  if (!doc.paths || typeof doc.paths !== "object") {
    throw new Error("OpenAPI/Swagger file contains no paths");
  }

  const store = TemplateStore.get();
  const createdTemplates: TemplateDTO[] = [];

  const methods = ["get", "post", "put", "delete", "patch", "head", "options"]; 

  for (const rawPath of Object.keys(doc.paths)) {
    const pathObj = doc.paths[rawPath];
    if (!pathObj || typeof pathObj !== "object") continue;

    for (const m of Object.keys(pathObj)) {
      const method = m.toLowerCase();
      if (!methods.includes(method)) continue;

      const op = pathObj[m];
      if (!op) continue;

      // Determine a success response code to use for authSuccessRegex.
      // Prefer 200, otherwise first 2xx found, otherwise fallback to 2xx matcher.
      let successCode: string | undefined;
      if (op.responses && typeof op.responses === "object") {
        if (op.responses["200"]) {
          successCode = "200";
        } else {
          for (const code of Object.keys(op.responses)) {
            if (/^2\d\d$/.test(code)) {
              successCode = code;
              break;
            }
          }
        }
      }

      const authSuccessRegex = successCode ? `HTTP/1[.]1 ${successCode}` : `HTTP/1[.]1 2\\d\\d`;

      // Build TemplateDTO
      const template: TemplateDTO = {
        id: generateID(),
        requestId: generateID(),
        authSuccessRegex,
        rules: [],
        meta: {
          host: serverInfo.host ?? "",
          port: serverInfo.port ?? (serverInfo.isTls ? 443 : 80),
          path: rawPath,
          isTls: !!serverInfo.isTls,
          method: method.toUpperCase(),
        },
      };

      // Add to in-memory store and persist under the current project
      store.addTemplate(template);
      await withProject(sdk, async (projectId) => {
        await createTemplate(sdk, projectId, template);
        sdk.api.send("templates:created", template);
      });

      createdTemplates.push(template);
    }
  }

  return createdTemplates;
};