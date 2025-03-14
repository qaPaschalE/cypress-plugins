#!/usr/bin/env node
import "dotenv/config";
import fs from "fs/promises";
import axios from "axios";
import chalk from "chalk";
import { Command } from "commander";
import { getCIProvider } from "./ciProviders.js";

// Load package.json version dynamically
const packageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf-8")
);

// CLI Command setup
const program = new Command();
program
  .version(packageJson.version)
  .option(
    "--ci-provider <type>",
    "CI Provider [github|bitbucket|circleci|jenkins|none|local]",
    "github"
  )
  .option(
    "--custom-url <type>",
    "Custom test report URL (if --ci-provider=custom)",
    ""
  )
  .option(
    "--report-dir <type>",
    "Mochawesome report directory",
    "cypress/reports"
  )
  .option(
    "--screenshot-dir <type>",
    "Cypress screenshot directory",
    "cypress/screenshots"
  )
  .option("--video-dir <type>", "Cypress video directory", "cypress/videos")
  .option("--verbose", "Show detailed log output", false)
  .option("--only-failed", "Only send notifications for failed tests", false)
  .option("--custom-text <type>", "Additional text in Teams message")
  .option(
    "--module-name <type>",
    "Module name associated with the test run",
    process.env.MODULE_NAME || ""
  )
  .option(
    "--team-name <type>",
    "Team name receiving the test report",
    process.env.TEAM_NAME || ""
  )
  .parse(process.argv);

const options = program.opts();
const REPORT_PATH = `${options.reportDir}/html/index.json`;
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

// Fetch artifact URL based on CI Provider
const ciProvider = getCIProvider(options.ciProvider);
const REPORT_URL =
  options.customUrl ||
  (await ciProvider.getArtifactUrl()) ||
  "No report URL available";

console.log(chalk.blueBright(`🚀 Running version: ${packageJson.version}`));
console.log(chalk.cyan(`📢 Report URL: ${REPORT_URL}`));

// Read and process the test report
async function displayTestResults(report: any) {
  const stats = report.stats;
  let allTests: any[] = [];

  function collectTests(suite: any) {
    allTests = allTests.concat(suite.tests || []);
    (suite.suites || []).forEach(collectTests);
  }

  if (report.results && report.results.length > 0) {
    const rootSuites = report.results[0].suites;
    rootSuites.forEach(collectTests);
  }

  const total = stats.tests;
  const passed = stats.passes;
  const failed = stats.failures;
  const pending = stats.pending;
  const duration = (stats.duration / 1000).toFixed(2);

  const start = new Date(stats.start).toLocaleString();
  const end = new Date(stats.end).toLocaleString();

  const passPercentage = ((passed / total) * 100).toFixed(1);
  const failPercentage = ((failed / total) * 100).toFixed(1);
  const pendingPercentage = ((pending / total) * 100).toFixed(1);

  // Pie chart with 11 segments
  const totalSegments = 11;
  const passSegments = Math.round((passed / total) * totalSegments);
  const failSegments = Math.round((failed / total) * totalSegments);
  const pendingSegments = Math.round((pending / total) * totalSegments);
  const emptySegments =
    totalSegments - (passSegments + failSegments + pendingSegments);

  let pieChart =
    "🟢".repeat(passSegments) +
    "🔴".repeat(failSegments) +
    "⚠️".repeat(pendingSegments) +
    "⚪".repeat(emptySegments);

  const failedTests = allTests
    .filter((test) => test.state === "failed")
    .map((test) => ({
      title: test.title,
      error: test.err?.message || "No error message available",
      context: test.context ? JSON.parse(test.context)[0].value : "",
    }));

  return {
    total,
    passed,
    failed,
    pending,
    duration,
    start,
    end,
    passPercentage,
    failPercentage,
    pendingPercentage,
    pieChart,
    failedTests,
  };
}

// Send results to Microsoft Teams
async function sendTeamsReport() {
  try {
    if (!TEAMS_WEBHOOK_URL) {
      console.error(
        chalk.red("❌ Missing TEAMS_WEBHOOK_URL environment variable")
      );
      return;
    }

    const reportData = await fs.readFile(REPORT_PATH, "utf-8");
    const report = JSON.parse(reportData);
    const {
      total,
      passed,
      failed,
      pending,
      duration,
      start,
      end,
      passPercentage,
      failPercentage,
      pendingPercentage,
      pieChart,
      failedTests,
    } = await displayTestResults(report);

    const allTestsPassed = failed === 0;
    const buttonColor = allTestsPassed ? "00FF00" : "FF0000";
    const buttonText = allTestsPassed
      ? "View Full Report (All Tests Passed)"
      : "View Full Report (Some Tests Failed)";

    const message = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: buttonColor,
      summary: "Cypress Test Results",
      sections: [
        {
          activityTitle: `${options.moduleName} QA Test Report Summary`,
          activitySubtitle: `Test Run: ${start} - ${end}\nTotal Tests: ${total} | Duration: ${duration}s`,
          activityImage:
            "https://d2ef4hkqu4id.cloudfront.net/cy_logo_a009bb69d4.jpeg",
          facts: [
            { name: "Passed", value: `✅ ${passed} (${passPercentage}%)` },
            { name: "Failed", value: `❌ ${failed} (${failPercentage}%)` },
            { name: "Pending", value: `⚠️ ${pending} (${pendingPercentage}%)` },
          ],
          markdown: true,
        },
        {
          title: "Test Status Distribution",
          text: `📊 **Pie Chart**: ${pieChart}\n\n✅ Passed: ${passPercentage}% 🟢\n❌ Failed: ${failPercentage}% 🔴\n⚠️ Pending: ${pendingPercentage}% ⚠️\n`,
          markdown: true,
        },
        {
          title: allTestsPassed ? "All Tests Passed!" : "Failed Tests",
          text: allTestsPassed
            ? "All tests executed successfully!"
            : failedTests
                .map(
                  (t) =>
                    `❌ **${t.title}**\nError:\n\`${t.error}\`\nVideo: ${
                      t.context ? t.context : "N/A"
                    }\n`
                )
                .join("\n\n"),
          markdown: true,
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: buttonText,
          targets: [{ os: "default", uri: REPORT_URL }],
        },
      ],
    };

    await axios.post(TEAMS_WEBHOOK_URL, message);
    console.log(chalk.green("✅ Teams notification sent successfully!"));
  } catch (error: any) {
    console.error(
      chalk.red("❌ Failed to send Teams notification:", error.message)
    );
  }
}

sendTeamsReport();
