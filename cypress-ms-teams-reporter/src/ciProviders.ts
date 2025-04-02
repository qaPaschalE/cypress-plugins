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
      return null;
    }
  }
}

export class BitbucketProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    console.log(
      chalk.yellow("⚠️ Bitbucket artifact retrieval not yet implemented.")
    );
    return null;
  }
}

export class CircleCIProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    console.log(
      chalk.yellow("⚠️ CircleCI artifact retrieval not yet implemented.")
    );
    return null;
  }
}

export class JenkinsProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    console.log(
      chalk.yellow("⚠️ Jenkins artifact retrieval not yet implemented.")
    );
    return null;
  }
}

export class LocalProvider implements CIProvider {
  async getArtifactUrl(): Promise<string | null> {
    console.log(chalk.blue("📄 Running locally, no artifact URL available."));
    return null;
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
