// src/lib/github.ts

export interface CleanedCommitData {
  owner: string;
  repo: string;
  sha: string;
  shortSha: string;
  message: string;
  diffText: string;
}

const IGNORED_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  '.svg',
  '.min.js',
];

const MAX_DIFF_CHARS = 4000;

export function parseGitHubCommitUrl(url: string) {
  const regex = /github\.com\/([^/]+)\/([^/]+)\/commit\/([a-fA-F0-9]{7,40})/;
  const match = url.trim().match(regex);

  if (!match) {
    throw new Error(
      'Invalid GitHub commit URL. Expected format: https://github.com/owner/repo/commit/abc1234'
    );
  }

  return {
    owner: match[1],
    repo: match[2],
    sha: match[3],
  };
}

export async function fetchCleanedCommit(
  commitUrl: string
): Promise<CleanedCommitData> {
  const { owner, repo, sha } = parseGitHubCommitUrl(commitUrl);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'DevCast-App',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // FIX: this was "https://github.com{owner}/..." which is not a valid API URL.
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;

  const response = await fetch(apiUrl, {
    headers,
    next: { revalidate: 3600 }, // cache identical commit lookups for 1 hour
  });

  if (response.status === 404) {
    throw new Error('Commit not found. Make sure the repository is public.');
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error('GitHub rate limit hit. Try again later.');
  }
  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status}).`);
  }

  const data = await response.json();

  const filteredPatches = (data.files || [])
    .filter((file: { filename: string; patch?: string }) => {
      if (!file.patch) return false;
      return !IGNORED_FILES.some((ignored) => file.filename.endsWith(ignored));
    })
    .map(
      (file: { filename: string; patch: string }) =>
        `File: ${file.filename}\n${file.patch}`
    )
    .join('\n\n');

  const trimmedDiff = filteredPatches.slice(0, MAX_DIFF_CHARS);

  return {
    owner,
    repo,
    sha,
    shortSha: sha.slice(0, 7),
    message: data.commit?.message || 'No commit message',
    diffText: trimmedDiff || 'No readable text diff found.',
  };
}
