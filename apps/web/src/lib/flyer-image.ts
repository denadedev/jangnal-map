// 운영자가 올린 전단 이미지를 가로 1,600px 이하 WebP로 줄인다. DB에 그대로 저장한다.
// 세로로 긴 전단이 많아서 긴 변이 아니라 가로를 맞춘다. 세로는 WebP 한계(16,383px)까지 둔다.
import sharp from "sharp";

export const MAX_FLYER_INPUT_BYTES = 20_000_000;
export const MAX_FLYER_PAGE_BYTES = 2_000_000;
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 16383;
const QUALITIES = [80, 70, 60];
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export interface FlyerPageImage {
  image: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  byteSize: number;
}

export class FlyerImageError extends Error {}

export async function toFlyerPageImage(input: Buffer): Promise<FlyerPageImage> {
  if (input.length === 0 || input.length > MAX_FLYER_INPUT_BYTES) throw new FlyerImageError("이미지는 20MB 이하여야 해요.");
  let format: string | undefined;
  try {
    ({ format } = await sharp(input).metadata());
  } catch {
    throw new FlyerImageError("이미지를 읽지 못했어요.");
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) throw new FlyerImageError("jpg, png, webp 이미지만 올릴 수 있어요.");

  for (const quality of QUALITIES) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= MAX_FLYER_PAGE_BYTES) {
      return { image: data, contentType: "image/webp", width: info.width, height: info.height, byteSize: data.length };
    }
  }
  throw new FlyerImageError("이미지를 2MB 안으로 줄이지 못했어요.");
}
