import { defineConfig } from "cypress";

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  const mochawesome = await import("cypress-mochawesome-reporter/plugin");
  mochawesome.default(on); // Ensure compatibility with CommonJS modules

  return config;
}

export default defineConfig({
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    saveJson: true,
  },
  e2e: {
    setupNodeEvents,
  },
});
