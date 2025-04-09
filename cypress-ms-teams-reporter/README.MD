# **@paschal_cheps/cypress-ms-teams-reporter** 🏆🚀

<table align="center"><tr><td align="center">
<img src="https://github.com/qaPaschalE/cypress-plugins/blob/main/assets/paschal%20logo%20(2).png?raw=true" alt="paschal Logo" style="max-width:120px;  margin-top:15px;"/>
</td></tr></table>

#

A Cypress reporter that sends test results to Microsoft Teams.

</td></tr></table>

[![npm version](https://img.shields.io/npm/v/@paschal_cheps/cypress-ms-teams-reporter)](https://www.npmjs.com/package/@paschal_cheps/cypress-ms-teams-reporter)
[![license](https://img.shields.io/npm/l/@paschal_cheps/cypress-ms-teams-reporter)](https://github.com/qaPaschalE/cypress-plugins/@paschal_cheps/cypress-ms-teams-reporter/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dt/@paschal_cheps/cypress-ms-teams-reporter)](https://www.npmjs.com/package/@paschal_cheps/cypress-ms-teams-reporter)
[![Build Status](https://github.com/qaPaschalE/cypress-plugins/actions/workflows/build-cypress-ms-teams-reporter.yml/badge.svg)](https://github.com/aPaschalE/cypress-plugins/actions/workflows/build-cypress-ms-teams-reporter.yml)
[![downloads all time](https://img.shields.io/npm/dt/@paschal_cheps/cypress-ms-teams-reporter.svg?style=flat&color=black&label=lifetime%20downloads)](https://www.npmjs.com/package/@paschal_cheps/cypress-ms-teams-reporter)

## Overview

A **Microsoft Teams** reporter for **Cypress test automation** that integrates test reports from **Mochawesome** and sends them as notifications to Teams channels. Supports multiple **CI/CD providers** like GitHub, Bitbucket, CircleCI, and Jenkins.

## **📝 Example Teams Reports**

### **📌 Failed Report**

<img src="https://github.com/qaPaschalE/cypress-plugins/blob/main/assets/Failed_screenshot.jpeg?raw=true" alt="teams report with fail test screenshot" width="50%" />

### **📌 Passed Report**

<img src="https://github.com/qaPaschalE/cypress-plugins/blob/main/assets/Passed_screenshot.jpeg?raw=true" alt="teams report with pass test screenshot" width="50%" />

---

## **📌 Features**

✅ **CI/CD Integration** – Supports GitHub Actions, Bitbucket, CircleCI, Jenkins, or local execution.  
✅ **Microsoft Teams Webhook Support** – Sends test execution reports directly to a Teams channel.  
✅ **Mochawesome Report Parsing** – Extracts data from Cypress test runs.  
✅ **Screenshots & Videos Attachments** – Includes media from test failures.  
✅ **Custom Messages** – Add custom text and metadata (Module Name, Team Name, etc.).  
✅ **Only Failed Tests Mode** – Send notifications only if tests fail.  
✅ **Detailed Logging** – Enable verbose output for debugging.

---

## Prerequisites

- **[cypress-mochawesome-reporter](https://www.npmjs.com/package/cypress-mochawesome-reporter)** must be installed and configured in your Cypress setup and saveJson set to true in reporterOptions.

## **📦 Installation**

```sh
npm install -g @paschal_cheps/cypress-ms-teams-reporter
```

or as a **dev dependency**:

```sh
npm install --save-dev @paschal_cheps/cypress-ms-teams-reporter
```

### **Using `yarn`**

```sh
yarn add -D @paschal_cheps/cypress-ms-teams-reporter
```

---

## **⚙️ Usage**

### **1️⃣ Set up Microsoft Teams Webhook**

To send reports to Microsoft Teams, you need a webhook URL:

- Go to **Microsoft Teams**
- Add a **new Incoming Webhook** to your channel
- Copy the generated **Webhook URL**

### **2️⃣ Configure Environment Variables**

Create a `.env` file in your project root:

```ini
TEAMS_WEBHOOK_URL=https://your-teams-webhook-url
GITHUB_TOKEN=your-github-token  # Only required for GitHub CI
BITBUCKET_WORKSPACE=your-bitbucket-workspace # Required for Bitbucket CI
BITBUCKET_REPO_SLUG=your-bitbucket-repo-slug # Required for Bitbucket CI
BITBUCKET_BUILD_NUMBER=your-bitbucket-build-number # Required for Bitbucket CI
CIRCLE_PROJECT_USERNAME=your-circleci-project-username # Required for CircleCI
CIRCLE_PROJECT_REPONAME=your-circleci-project-reponame # Required for CircleCI
CIRCLE_BUILD_NUM=your-circleci-build-number # Required for CircleCI
CIRCLE_WORKFLOW_ID=your-circleci-workflow-id # Required for CircleCI
CIRCLE_PROJECT_ID=your-circleci-project-id # Required for CircleCI
```

---

### **3️⃣ Running the Reporter**

#### **🔹 Default Usage**

```sh
npx cypress-ms-teams-reporter --ci-provider=github
```

#### **🔹 With `.env` file**

```sh
dotenv -c npx cypress-ms-teams-reporter --ci-provider=github
```

#### **🔹 With Custom Report URL**

```sh
npx cypress-ms-teams-reporter --custom-url="[https://example.com/report.html](https://example.com/report.html)"
```

#### **🔹 Only Send Failed Tests**

```sh
npx cypress-ms-teams-reporter --only-failed
```

### reportConfig.js Usage

```js
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
```

---

## **🔧 CLI Options**

| Option                     | Description                                                                 | Default                 |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| `--ci-provider <type>`     | Select CI provider (`github`, `bitbucket`, `circleci`, `jenkins`, `local`)  | `github`                |
| `--custom-url <url>`       | Provide a custom test report URL                                            | `""`                    |
| `--report-dir <path>`      | Path to the Mochawesome report directory                                    | `mochareports`          |
| `--screenshot-dir <path>`  | Cypress screenshot directory                                                | `cypress/screenshots`   |
| `--video-dir <path>`       | Cypress video directory                                                     | `cypress/videos`        |
| `--verbose`                | Enable detailed logging                                                     | `false`                 |
| `--only-failed`            | Send notifications only for failed tests                                    | `false`                 |
| `--custom-text <text>`     | Add extra text to the Teams message                                         | `""`                    |
| `--module-name <type>`     | Name of the module under test                                               | `""`                    |
| `--team-name <type>`       | Name of the team receiving the test report                                  | `""`                    |
| `--config-file <path>`     | Path to the configuration file for the Teams reporter                       | `teamsReport.config.js` |

---

## **🖥️ CI/CD Integration**

### **🔹 GitHub Actions**

Add this step to your workflow:

```yaml
- name: Send Cypress Report to Teams
  run: |
    npm install
    dotenv -c npx cypress-ms-teams-reporter --ci-provider=github
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### **🔹 Jenkins**

```sh
export TEAMS_WEBHOOK_URL="https://your-teams-webhook-url"
npx cypress-ms-teams-reporter --ci-provider=jenkins
```

### **🔹 Bitbucket Pipelines**

```yaml
script:
  - pipe: atlassian/dotenv:1.3.0
    variables:
      DOTENV_PATH: ".env"
  - npx cypress-ms-teams-reporter --ci-provider=bitbucket
```

**Note:** Ensure you have set the `BITBUCKET_WORKSPACE`, `BITBUCKET_REPO_SLUG`, and `BITBUCKET_BUILD_NUMBER` environment variables in your Bitbucket Pipeline settings or in your `.env` file. You can use the `atlassian/dotenv` pipe to load environment variables from a `.env` file.

### **🔹 CircleCI**

```yaml
jobs:
  build:
    steps:
      - run:
          name: Send Cypress Report to Teams
          command: |
            npm install
            npm install dotenv -g
            dotenv -e .env -- npx cypress-ms-teams-reporter --ci-provider=circleci
          environment:
            TEAMS_WEBHOOK_URL: $TEAMS_WEBHOOK_URL
            CIRCLE_PROJECT_USERNAME: $CIRCLE_PROJECT_USERNAME
            CIRCLE_PROJECT_REPONAME: $CIRCLE_PROJECT_REPONAME
            CIRCLE_BUILD_NUM: $CIRCLE_BUILD_NUM
            CIRCLE_WORKFLOW_ID: $CIRCLE_WORKFLOW_ID
            CIRCLE_PROJECT_ID: $CIRCLE_PROJECT_ID
```

**Note:** Ensure you have set the `TEAMS_WEBHOOK_URL`, `CIRCLE_PROJECT_USERNAME`, `CIRCLE_PROJECT_REPONAME`, `CIRCLE_BUILD_NUM`, `CIRCLE_WORKFLOW_ID`, and `CIRCLE_PROJECT_ID` environment variables in your CircleCI project settings or in your `.env` file.

---

## **📊 Report Example (With Pie Chart)**

✅ **Passed:** `80%` 🟢
❌ **Failed:** `15%` 🔴
⚠️ **Pending:** `5%` ⚠️

📊 **Pie Chart:**
🟢🟢🟢🟢🟢🟢🟢🟢🔴🔴⚠️

## Report Example

## ![Default Failed Report](about:sanitized)

## ![Default Passed Report](about:sanitized)

## **📜 License**

MIT License - [@paschal_cheps](https://github.com/paschal-cheps)

🚀 Happy Testing\! 🎯

```

```
