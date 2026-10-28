import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { FlyerImageError, toFlyerPageImage } from "./flyer-image";

const png = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#e33" } }).png().toBuffer();

describe("toFlyerPageImage", () => {
  it("shrinks a wide image to 1,600px across as WebP", async () => {
    const page = await toFlyerPageImage(await png(3200, 4000));
    expect(page).toMatchObject({ contentType: "image/webp", width: 1600, height: 2000 });
    expect((await sharp(page.image).metadata()).format).toBe("webp");
    expect(page.byteSize).toBe(page.image.length);
  });

  it("keeps a long flyer readable instead of fitting the long edge", async () => {
    const page = await toFlyerPageImage(await png(1000, 6000));
    expect(page).toMatchObject({ width: 1000, height: 6000 });
  });

  it("rejects files that are not images or are another format", async () => {
    await expect(toFlyerPageImage(Buffer.from("<html>login</html>"))).rejects.toBeInstanceOf(FlyerImageError);
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).gif().toBuffer();
    await expect(toFlyerPageImage(gif)).rejects.toThrow("jpg, png, webp 이미지만 올릴 수 있어요.");
  });
});
