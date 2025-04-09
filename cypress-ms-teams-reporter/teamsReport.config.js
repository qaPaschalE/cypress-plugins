// teamsReport.config.js
import "dotenv/config";

export default {
  teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL, // Replace with your actual webhook URL
  reportDir: "cypress/reports", // Customize the report directory if needed
  reportFilename: "index.json", // Customize the report filename if needed
  reportTitle: "Cypress E2E Tests", // Customize the title of the report in Teams
  ciProvider: "local", // Specify your CI provider (github, bitbucket, circleci, jenkins, local, none)
  customFacts: [
    { name: "Environment", value: "Staging" },
    { name: "Release", value: "v1.2.3" },
  ],

  reportUrl: process.env.REPORT_URL, // Add your report URL here
  customUrl: process.env.REPORT_URL,
};
