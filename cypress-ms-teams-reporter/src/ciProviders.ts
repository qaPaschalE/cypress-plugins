// ciProviders.ts
import axios from "axios";
import chalk from "chalk";

interface CIProvider {
  getArtifactUrl(): Promise<string | null>;
}

export class GitHubProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    const { GITHUB_RUN_ID, GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;

    if (!GITHUB_RUN_ID || !GITHUB_REPOSITORY || !GITHUB_TOKEN) {
      console.error(
        chalk.red("❌ Missing GitHub credentials. Skipping artifact retrieval.")
      );
      return null;
    }

    try {
      // Fetch artifacts for the current workflow run
      const response = await axios.get(
        `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/artifacts`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      // Check if any artifacts exist
      if (!response.data.artifacts || response.data.artifacts.length === 0) {
        console.error(chalk.yellow("⚠️ No artifacts found for this run."));
        return null;
      }

      // Extract the first artifact's ID
      const artifactId = response.data.artifacts[0].id;

      // Construct the artifact URL in the desired format
      const artifactUrl = `https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/artifacts/${artifactId}`;

      console.log(chalk.green(`✅ Artifact URL: ${artifactUrl}`));
      return artifactUrl;
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to fetch GitHub artifact URL:", error)
      );
      return process.env.REPORT_URL || null;
    }
  }
}

export class BitbucketProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    const { BITBUCKET_WORKSPACE, BITBUCKET_REPO_SLUG, BITBUCKET_BUILD_NUMBER } =
      process.env;

    if (
      !BITBUCKET_WORKSPACE ||
      !BITBUCKET_REPO_SLUG ||
      !BITBUCKET_BUILD_NUMBER
    ) {
      console.error(
        chalk.red(
          "❌ Missing Bitbucket credentials. Skipping artifact retrieval."
        )
      );
      return null;
    }

    try {
      const artifactUrl = `https://bitbucket.org/${BITBUCKET_WORKSPACE}/${BITBUCKET_REPO_SLUG}/pipelines/results/${BITBUCKET_BUILD_NUMBER}`;
      console.log(
        chalk.green(`✅ Bitbucket Pipeline Results URL: ${artifactUrl}`)
      );
      return artifactUrl;
    } catch (error) {
      console.error(
        chalk.red(
          "❌ Failed to construct Bitbucket Pipeline Results URL:",
          error
        )
      );
      return process.env.REPORT_URL || null;
    }
  }
}

export class CircleCIProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    const {
      CIRCLE_PROJECT_USERNAME,
      CIRCLE_PROJECT_REPONAME,
      CIRCLE_BUILD_NUM,
      CIRCLE_WORKFLOW_ID,
      CIRCLE_PROJECT_ID,
    } = process.env;

    if (
      !CIRCLE_PROJECT_USERNAME ||
      !CIRCLE_PROJECT_REPONAME ||
      !CIRCLE_BUILD_NUM ||
      !CIRCLE_WORKFLOW_ID ||
      !CIRCLE_PROJECT_ID
    ) {
      console.error(
        chalk.red(
          "❌ Missing CircleCI credentials. Skipping artifact retrieval."
        )
      );
      return null;
    }

    try {
      const artifactUrl = `https://app.circleci.com/pipelines/github/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}/${CIRCLE_PROJECT_ID}/workflows/${CIRCLE_WORKFLOW_ID}/jobs/${CIRCLE_BUILD_NUM}/artifacts`;
      console.log(chalk.green(`✅ CircleCI Artifacts URL: ${artifactUrl}`));
      return artifactUrl;
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to construct CircleCI Artifacts URL:", error)
      );
      return process.env.REPORT_URL || null;
    }
  }
}

export class JenkinsProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    const { JENKINS_URL, JOB_NAME, BUILD_URL } = process.env;

    if (!JENKINS_URL || !JOB_NAME || !BUILD_URL) {
      console.error(
        chalk.red(
          "❌ Missing Jenkins credentials (JENKINS_URL, JOB_NAME, BUILD_URL). Skipping artifact retrieval."
        )
      );
      return null;
    }

    try {
      const artifactUrl = BUILD_URL;
      console.log(
        chalk.green(`✅ Jenkins Pipeline Results URL: ${artifactUrl}`)
      );
      return artifactUrl;
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to construct Jenkins Pipeline Results URL:", error)
      );
      return process.env.REPORT_URL || null;
    }
  }
}

export class LocalProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    console.log(
      chalk.blue("📄 Running locally, using REPORT_URL from environment.")
    );
    return process.env.REPORT_URL || null;
  }
}

export function getCIProvider(provider?: string): CIProvider {
  const ciProvider = provider?.toLowerCase() || "github"; // Default to GitHub

  switch (ciProvider) {
    case "github":
      return new GitHubProvider();
    case "bitbucket":
      return new BitbucketProvider();
    case "circleci":
      return new CircleCIProvider();
    case "jenkins":
      return new JenkinsProvider();
    case "local":
    case "none":
      return new LocalProvider();
    default:
      console.warn(
        `⚠️ Unknown CI provider: ${provider}. Defaulting to GitHub.`
      );
      return new GitHubProvider();
  }
}
