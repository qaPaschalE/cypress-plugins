#!/usr/bin/env node
import "dotenv/config"; // Load environment variables from .env
import fs from "fs/promises";
import chalk from "chalk";
import { Command } from "commander";
import { getCIProvider } from "./ciProviders.js";
import { IncomingWebhook } from "ms-teams-webhook"; // Import IncomingWebhook
import path from "path"; // Import path for config file
import { pathExists } from "fs-extra"; // Import pathExists from fs-extra

// Validate required environment variables
if (!process.env.TEAMS_WEBHOOK_URL) {
  console.error(
    chalk.red("❌ TEAMS_WEBHOOK_URL is not defined in the environment.")
  );
  process.exit(1); // Exit the script with an error code
}

if (!process.env.REPORT_DIR || !process.env.REPORT_FILENAME) {
  console.error(
    chalk.red(
      "❌ REPORT_DIR or REPORT_FILENAME is not defined in the environment."
    )
  );
  process.exit(1); // Exit the script with an error code
}

// Define interfaces
interface Fact {
  name: string;
  value: string;
}
interface ReportConfig {
  teamsWebhookUrl?: string;
  reportDir?: string;
  reportFilename?: string;
  reportTitle?: string;
  ciProvider?: string;
  customFacts?: Fact[];
  projectRoot?: string;
  verbose?: boolean; // Added verbose option
  reportUrl?: string; // Add reportUrl here
  customUrl?: string; // Add customUrl here
}

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
  .option(
    "--config-file <path>",
    "Path to the configuration file for the Teams reporter",
    "teamsReport.config.js" // Default config file name changed here
  )
  .parse(process.argv);

const options = program.opts();

const REPORT_PATH = `${options.reportDir}/html/index.json`; // Adjust this path based on your Mochawesome JSON output
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

const DEFAULT_CONFIG: ReportConfig = {
  reportDir: "cypress/reports",
  reportFilename: "index.json",
  reportTitle: "Cypress E2E Tests",
  ciProvider: "github",
  customFacts: [],
  projectRoot: process.cwd(),
  verbose: false, // Default verbose to false
};

async function loadConfig(
  projectRoot: string = process.cwd()
): Promise<ReportConfig> {
  const configFileName = options.configFile;
  const configPath = path.resolve(projectRoot, configFileName);
  let finalConfig: ReportConfig = {
    ...DEFAULT_CONFIG,
    projectRoot,
    verbose: options.verbose,
  };
  if (options.ciProvider && options.ciProvider !== "github") {
    // Only override if a value other than default is provided
    finalConfig.ciProvider = options.ciProvider;
  }
  if (options.verbose) {
    console.log(
      chalk.blue("Command-line CI Provider Option:"),
      options.ciProvider
    );
  }
  try {
    if (await pathExists(configPath)) {
      const importedConfig = await import(configPath);
      const loadedConfig = importedConfig.default as ReportConfig; // Access the default export
      if (options.verbose) {
        console.log(chalk.yellow(`⚙️ Loaded config from: ${configPath}`));
      }
      finalConfig = { ...finalConfig, ...loadedConfig }; // Merge loaded config into the base config
    } else {
      if (options.verbose) {
        console.log(
          chalk.yellow(
            `⚠️ No config file found at: ${configPath}. Using default settings.`
          )
        );
      }
    }
  } catch (error) {
    console.error(
      chalk.red(`❌ Error loading config file from ${configPath}:`),
      error
    );
  }
  return finalConfig;
}

const config = await loadConfig(process.cwd());

// Fetch artifact URL based on CI Provider
const ciProvider = getCIProvider(config.ciProvider);
const artifactUrlFromProvider = await ciProvider.getArtifactUrl();

let REPORT_URL = options.customUrl;
if (!REPORT_URL && config.ciProvider === "local") {
  REPORT_URL = config.customUrl || config.reportUrl;
}
if (!REPORT_URL) {
  REPORT_URL = artifactUrlFromProvider || "No report URL available";
}

if (options.verbose) {
  console.log(chalk.blue("Configured CI Provider:"), config.ciProvider);
  console.log(
    chalk.blue("Artifact URL from Provider:"),
    artifactUrlFromProvider
  );
}

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
async function sendTeamsReport(options: any) {
  try {
    const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!teamsWebhookUrl) {
      console.error(
        chalk.red("❌ Missing TEAMS_WEBHOOK_URL environment variable")
      );
      return;
    }

    const webhook = new IncomingWebhook(teamsWebhookUrl);

    // Check if the report file exists
    const reportExists = await pathExists(REPORT_PATH);
    if (!reportExists) {
      console.error(chalk.red(`❌ Report file not found at: ${REPORT_PATH}`));
      return;
    }

    // Read and parse the report
    const reportData = await fs.readFile(REPORT_PATH, "utf-8");
    const report = JSON.parse(reportData);

    // Process test results
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
          text: `📊 **Pie Chart**: ${pieChart}\n✅ Passed: ${passPercentage}% 🟢\n❌ Failed: ${failPercentage}% 🔴\n⚠️ Pending: ${pendingPercentage}% ⚠️`,
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
                    }`
                )
                .join("\n"),
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

    // Send the message to Teams
    await webhook.send(message);
    console.log(chalk.green("✅ Teams notification sent successfully!"));
  } catch (error: any) {
    console.error(
      chalk.red("❌ Failed to send Teams notification:"),
      error.message
    );
    console.error(chalk.red("Stack Trace:"), error.stack); // Log stack trace for debugging
  }
}

export { sendTeamsReport };
