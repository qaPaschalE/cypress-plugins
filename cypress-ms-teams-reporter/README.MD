# **@paschal_cheps/cypress-ms-teams-reporter** 🏆🚀

<table align="center" style="margin-bottom:30px;"><tr><td align="center" width="9999" heigth="9999 " >
 <img src="assets/paschal logo (2).png" alt="paschal Logo" style="margin-top:25px;" align="center"/>

#

A Cypress reporter that sends test results to Microsoft Teams.

</td></tr></table>

[![npm version](https://img.shields.io/npm/v/@paschal_cheps/cypress-ms-teams-reporter)](https://www.npmjs.com/package/@paschal_cheps/cypress-ms-teams-reporter)
[![npm downloads](https://img.shields.io/npm/dt/@paschal_cheps/cypress-ms-teams-reporter)](https://www.npmjs.com/package/@paschal_cheps/cypress-ms-teams-reporter)
[![license](https://img.shields.io/npm/l/@paschal_cheps/cypress-ms-teams-reporter)](https://github.com/qaPaschalE/cypress-plugins/@paschal_cheps/cypress-ms-teams-reporter/blob/main/LICENSE)
![Build Status](https://github.com/cypress-plugins/cypress-ms-teams-reporter/actions/workflows/build-cypress-ms-teams-reporter.yml/badge.svg)

![Repo Views](https://github.com/qaPaschalE/cypress-plugins/blob/main/views-badge.svg)

[![downloads all time](https://img.shields.io/npm/dt/@paschal_cheps/cypress-ms-teams-reporter.svg?style=flat&color=black&label=lifetime%20downloads)](https://www.npmjs.com/package/@paschal_cheps/cypress-ms-teams-reporter)

## Overview

A **Microsoft Teams** reporter for **Cypress test automation** that integrates test reports from **Mochawesome** and sends them as notifications to Teams channels. Supports multiple **CI/CD providers** like GitHub, Bitbucket, CircleCI, and Jenkins.

![Failed Tests](assets/Failed_screenshot.jpeg)
![Passed Tests](assets/Passed_screenshot.jpeg)

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
GITHUB_TOKEN=your-github-token  # Only required for GitHub CI
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
npx cypress-ms-teams-reporter --custom-url="https://example.com/report.html"
```

#### **🔹 Only Send Failed Tests**

```sh
npx cypress-ms-teams-reporter --only-failed
```

### Programmatic Usage

```js
const { sendTeamsReport } = require("cypress-ms-teams-reporter");

sendTeamsReport({
  ciProvider: "github",
  teamsWebhookUrl: "https://teams.webhook.url",
  reportDir: "cypress/reports",
  verbose: true,
});
```

## Cypress Integration

### Using `task` in `cypress.config.ts`

```ts
import { defineConfig } from "cypress";
import { sendTeamsReport } from "cypress-ms-teams-reporter";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        sendTeamsReport(options) {
          return sendTeamsReport(options);
        },
      });
    },
  },
});
```

### Using `on` events in `cypress.config.js`

```js
const { sendTeamsReport } = require("cypress-ms-teams-reporter");

module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      on("after:run", async (results) => {
        await sendTeamsReport({
          ciProvider: "github",
          teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,
          reportDir: "mochareports",
          testResults: results,
        });
      });
    },
  },
};
```

---

## **🔧 CLI Options**

| Option                    | Description                                                                | Default               |
| ------------------------- | -------------------------------------------------------------------------- | --------------------- |
| `--ci-provider <type>`    | Select CI provider (`github`, `bitbucket`, `circleci`, `jenkins`, `local`) | `github`              |
| `--custom-url <url>`      | Provide a custom test report URL                                           | `""`                  |
| `--report-dir <path>`     | Path to the Mochawesome report directory                                   | `mochareports`        |
| `--screenshot-dir <path>` | Cypress screenshot directory                                               | `cypress/screenshots` |
| `--video-dir <path>`      | Cypress video directory                                                    | `cypress/videos`      |
| `--verbose`               | Enable detailed logging                                                    | `false`               |
| `--only-failed`           | Send notifications only for failed tests                                   | `false`               |
| `--custom-text <text>`    | Add extra text to the Teams message                                        | `""`                  |
| `--module-name <type>`    | Name of the module under test                                              | `""`                  |
| `--team-name <type>`      | Name of the team receiving the test report                                 | `""`                  |

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
  - npx cypress-ms-teams-reporter --ci-provider=bitbucket
```

---

## **📊 Report Example (With Pie Chart)**

✅ **Passed:** `80%` 🟢  
❌ **Failed:** `15%` 🔴  
⚠️ **Pending:** `5%` ⚠️

📊 **Pie Chart:**  
🟢🟢🟢🟢🟢🟢🟢🟢🔴🔴⚠️

## Report Example

## ![Default Failed Report](cypress-ms-teams-reporter/src/img/Failed_screenshot.jpeg)

## ![Default Passed Report](cypress-ms-teams-reporter/src/img/Passed_screenshot.jpeg)

## **📜 License**

MIT License - [@paschal_cheps](https://github.com/paschal-cheps)

🚀 Happy Testing! 🎯
