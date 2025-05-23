import { defineConfig } from "cypress";
import mochawesome from "cypress-mochawesome-reporter/plugin";
import { sendTeamsReport } from "../cypress-ms-teams-reporter/src/index.js";

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  await mochawesome(on);

  return config;
}

export default defineConfig({
  screenshotsFolder: "cypress/reports",
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    charts: true,
    reportPageTitle: "Cypress Mochawesome Report",
    embeddedScreenshots: true,
    inlineAssets: true,
    saveJson: true,
    overwrite: true,
    html: true,
    json: true,
  },
  e2e: {
    setupNodeEvents,
  },
});
