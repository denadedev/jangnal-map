import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = new URL("./update-gitops-image.mjs", import.meta.url);
const sha = "a".repeat(40);
const fixture = "metadata:\n  name: jangnal-map-web\nspec:\n  image: registry.spamfam.kr/jangnal-map/web:not-built\n  sidecar: untouched\n";

for (const [name, input, tag, success] of [
  ["changes only the target image", fixture, sha, true],
  ["is idempotent", fixture.replace("not-built", sha), sha, true],
  ["rejects a non-SHA tag without writing", fixture, "main", false],
  ["rejects a missing image without writing", "kind: Deployment\n", sha, false],
  ["rejects ambiguous duplicate images without writing", fixture + fixture, sha, false],
]) {
  test(name, async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "jangnal-image-test-"));
    try {
      const file = path.join(dir, "deployment.yaml");
      await writeFile(file, input);
      const result = spawnSync(process.execPath, [script.pathname, file, tag], { encoding: "utf8" });
      assert.equal(result.status, success ? 0 : 1, result.stderr);
      if (!success) {
        assert.match(result.stderr, tag === "main"
          ? /full lowercase commit SHA/
          : /exactly one jangnal-map\/web image field/);
      }
      assert.equal(await readFile(file, "utf8"), success ? input.replace("not-built", sha) : input);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
