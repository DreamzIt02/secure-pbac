import { HandlerFn } from "./types.js";

export class RouteHandler {
  constructor(
    public readonly method  : string,
    public readonly template: string,
    public readonly handler : HandlerFn,
    public readonly metadata: Record<string, any> = {}
  ) {
    if (!template.startsWith("/")) {
      template = "/" + template;
    }
    if (!method) {
      throw new Error("HTTP method is required");
    }
  }
}
