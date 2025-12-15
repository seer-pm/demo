export const SEED_REPOS_URL =
  "https://raw.githubusercontent.com/deepfunding/dependency-graph/main/datasets/gg24-phase2/seedRepos.json";

export const SEED_REPOS_WITH_DEPS_URL =
  "https://raw.githubusercontent.com/deepfunding/dependency-graph/main/datasets/gg24-phase2/seedReposWithDependencies.json";

export type SeedRepos = string[];
export type SeedReposWithDependencies = Record<string, string[]>;

export type DependencyFilter = "all" | "within_limit" | "exceeds_limit";

export const MAX_DEPENDENCIES = 60; // Limit number of dependencies (outcomes) per market
export const DEPENDENCY_FILTER: DependencyFilter = "within_limit";
export const DEPENDENCIES_IGNORE: string[] = [];

/**
 * Extracts organization/package from a GitHub URL
 * Example: "https://github.com/0xpolygonmiden/crypto" -> "0xpolygonmiden/crypto"
 */
export function extractRepoNameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split("/").filter(Boolean);
  return pathParts.slice(0, 2).join("/");
}

export async function fetchSeedRepos(): Promise<SeedRepos> {
  const response = await fetch(SEED_REPOS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch seed repos: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSeedReposWithDependencies(): Promise<SeedReposWithDependencies> {
  const response = await fetch(SEED_REPOS_WITH_DEPS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch seed repos with dependencies: ${response.statusText}`);
  }
  return response.json();
}

export interface MarketCreationTask {
  seedRepo: string;
  index: number;
  dependencies: string[];
  skipReason?: string;
}

export function buildMarketCreationTasks(
  seedRepos: SeedRepos,
  seedReposWithDeps: SeedReposWithDependencies,
  options?: {
    dependencyFilter?: DependencyFilter;
    maxDependencies?: number;
    dependenciesIgnore?: string[];
  },
): MarketCreationTask[] {
  const dependencyFilter = options?.dependencyFilter ?? DEPENDENCY_FILTER;
  const maxDependencies = options?.maxDependencies ?? MAX_DEPENDENCIES;
  const dependenciesIgnore = options?.dependenciesIgnore ?? DEPENDENCIES_IGNORE;

  const marketCreationTasks: MarketCreationTask[] = [];

  for (let i = 0; i < seedRepos.length; i++) {
    const seedRepo = seedRepos[i];

    // Skip ignored seed repos
    if (dependenciesIgnore.includes(seedRepo)) {
      console.log(`Skipping ${seedRepo}: in DEPENDENCIES_IGNORE list`);
      marketCreationTasks.push({
        seedRepo,
        index: i,
        dependencies: [],
        skipReason: "in_DEPENDENCIES_IGNORE_list",
      });
      continue;
    }

    // Find the matching URL in seedReposWithDeps
    const seedRepoUrl = Object.keys(seedReposWithDeps).find((url) => {
      return extractRepoNameFromUrl(url) === seedRepo;
    });

    if (!seedRepoUrl) {
      console.warn(`No dependencies found for ${seedRepo}, skipping...`);
      marketCreationTasks.push({
        seedRepo,
        index: i,
        dependencies: [],
        skipReason: "no_dependencies_found",
      });
      continue;
    }

    const dependencies = seedReposWithDeps[seedRepoUrl];

    if (!dependencies || dependencies.length === 0) {
      console.warn(`No dependencies for ${seedRepo}, skipping...`);
      marketCreationTasks.push({
        seedRepo,
        index: i,
        dependencies: [],
        skipReason: "empty_dependencies",
      });
      continue;
    }

    // Extract organization/package from GitHub URLs
    const dependencyNames = dependencies.map(extractRepoNameFromUrl);
    const originalDependencyCount = dependencyNames.length;

    // Apply dependency filter
    if (dependencyFilter === "within_limit" && originalDependencyCount > maxDependencies) {
      console.log(
        `Skipping ${seedRepo}: has ${originalDependencyCount} dependencies (exceeds limit of ${maxDependencies})`,
      );
      marketCreationTasks.push({
        seedRepo,
        index: i,
        dependencies: [],
        skipReason: `exceeds_limit_${originalDependencyCount}_dependencies`,
      });
      continue;
    }
    if (dependencyFilter === "exceeds_limit" && originalDependencyCount <= maxDependencies) {
      console.log(
        `Skipping ${seedRepo}: has ${originalDependencyCount} dependencies (within limit of ${maxDependencies})`,
      );
      marketCreationTasks.push({
        seedRepo,
        index: i,
        dependencies: [],
        skipReason: `within_limit_${originalDependencyCount}_dependencies`,
      });
      continue;
    }

    // Limit dependencies to maxDependencies, more than that will return an "Out of gas" error
    const limitedDependencies = dependencyNames.slice(0, maxDependencies);

    console.log(
      `Preparing multi-scalar market for ${seedRepo} with ${limitedDependencies.length} outcomes (dependencies)${
        dependencyNames.length > maxDependencies ? ` (limited from ${dependencyNames.length})` : ""
      }`,
    );

    marketCreationTasks.push({
      seedRepo,
      index: i,
      dependencies: limitedDependencies,
    });
  }

  console.log(`Prepared ${marketCreationTasks.length} market creation tasks`);

  return marketCreationTasks;
}
