import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "default",
    resources: {
      default: typeof import("../locales/ja/default.json"),
      commands: typeof import("../locales/ja/commands.json"),
      components: typeof import("../locales/ja/components.json"),
    }
  }
}
