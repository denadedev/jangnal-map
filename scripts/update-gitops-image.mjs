import { readFile, writeFile } from "node:fs/promises";

try {
  const [file, sha] = process.argv.slice(2);
  if (!file || !/^[0-9a-f]{40}$/.test(sha ?? "")) {
    throw new Error("Expected a manifest path and a full lowercase commit SHA");
  }
  const input = await readFile(file, "utf8");
  const image = /^([ \t]*image: )registry\.spamfam\.kr\/jangnal-map\/web:[^\s]+([ \t]*)$/gm;
  if ([...input.matchAll(image)].length !== 1) {
    throw new Error("Expected exactly one jangnal-map/web image field");
  }
  const output = input.replace(image, `$1registry.spamfam.kr/jangnal-map/web:${sha}$2`);
  if (output !== input) await writeFile(file, output);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
