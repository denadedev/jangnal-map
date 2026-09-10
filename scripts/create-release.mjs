import { pathToFileURL } from 'node:url';

export async function createRelease({ repository, sha, token }, fetchImpl = fetch) {
  if (!/^[\w-]+\/[\w.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/.test(sha ?? '') || !token) {
    throw new Error('Invalid release configuration');
  }
  const base = `https://api.github.com/repos/${repository}`;
  const tag = `k3s-${sha}`;
  async function request(path, { method = 'GET', body, allowMissing = false } = {}) {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${response.status}`);
    return response.json();
  }

  const main = await request('/commits/main');
  if (main.sha !== sha) return 'superseded';
  const existing = await request(`/releases/tags/${tag}`, { allowMissing: true });
  if (existing) {
    if (existing.target_commitish !== sha) throw new Error('Existing release targets a different commit');
    return 'existing';
  }
  await request('/releases', {
    method: 'POST',
    body: {
      tag_name: tag,
      target_commitish: sha,
      name: `K3s ${sha.slice(0, 7)}`,
      generate_release_notes: true,
      body: [
        'CI 검증·Harbor 이미지 게시·GitOps 갱신 완료 기록입니다. 실제 K3s 배포 완료를 보장하지 않습니다.',
        '',
        `Image: \`registry.spamfam.kr/jangnal-map/web:${sha}\``,
        'Site: https://jangnal.spamfam.kr/',
        '배포 상태는 Argo CD의 jangnal-map Application에서 별도로 확인합니다.',
      ].join('\n'),
    },
  });
  return 'created';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createRelease({ repository: process.env.GITHUB_REPOSITORY, sha: process.env.GITHUB_SHA, token: process.env.GH_TOKEN })
    .then(result => console.log(`Release: ${result}`))
    .catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
