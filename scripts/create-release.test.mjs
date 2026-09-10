import assert from 'node:assert/strict';
import test from 'node:test';

const sha = 'a'.repeat(40);
const options = { repository: 'denadedev/jangnal-map', sha, token: 'test-token' };

async function run(responses, overrides = {}) {
  const { createRelease } = await import('./create-release.mjs');
  const requests = [];
  const result = await createRelease({ ...options, ...overrides }, async (url, init) => {
    requests.push({ url, ...init });
    assert.ok(responses.length, 'Unexpected API request');
    const [status, body] = responses.shift();
    return new Response(JSON.stringify(body), { status });
  });
  assert.equal(responses.length, 0);
  return { result, requests };
}

test('creates a release for the exact source SHA after confirming latest main', async () => {
  const { result, requests } = await run([[200, { sha }], [404, {}], [201, {}]]);
  assert.equal(result, 'created');
  assert.equal(requests[0].url, 'https://api.github.com/repos/denadedev/jangnal-map/commits/main');
  assert.equal(requests[1].url, `https://api.github.com/repos/denadedev/jangnal-map/releases/tags/k3s-${sha}`);
  assert.equal(requests[2].url, 'https://api.github.com/repos/denadedev/jangnal-map/releases');
  assert.equal(requests[2].method, 'POST');
  const body = JSON.parse(requests[2].body);
  assert.equal(body.tag_name, `k3s-${sha}`);
  assert.equal(body.target_commitish, sha);
  assert.equal(body.generate_release_notes, true);
  assert.match(body.body, /배포 완료를 보장하지/);
  assert.match(body.body, new RegExp(`registry.spamfam.kr/jangnal-map/web:${sha}`));
});

test('does not publish a stale main commit', async () => {
  const { result, requests } = await run([[200, { sha: 'b'.repeat(40) }]]);
  assert.equal(result, 'superseded');
  assert.equal(requests.length, 1);
});

test('reruns preserve the existing release', async () => {
  const { result, requests } = await run([[200, { sha }], [200, { target_commitish: sha }]]);
  assert.equal(result, 'existing');
  assert.equal(requests.length, 2);
});

for (const status of [403, 500]) {
  test(`does not treat release lookup HTTP ${status} as not found`, async () => {
    await assert.rejects(run([[200, { sha }], [status, {}]]), new RegExp(`HTTP ${status}`));
  });
}

test('fails if main cannot be read', async () => {
  await assert.rejects(run([[401, {}]]), /HTTP 401/);
});

test('fails if release creation fails', async () => {
  await assert.rejects(run([[200, { sha }], [404, {}], [422, {}]]), /HTTP 422/);
});

test('rejects an existing release targeting another commit', async () => {
  await assert.rejects(run([[200, { sha }], [200, { target_commitish: 'main' }]]), /different commit/);
});

test('rejects missing credentials and invalid repository or SHA before calling GitHub', async () => {
  for (const overrides of [{ token: '' }, { repository: '../other' }, { sha: 'main' }]) {
    await assert.rejects(run([], overrides), /Invalid release configuration/);
  }
});
