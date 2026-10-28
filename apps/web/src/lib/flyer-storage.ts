// 전단 페이지 이미지는 S3 호환 저장소(운영: Garage)에 둔다. DB에는 키만 남긴다.
// 사이트는 이미지를 /api/flyers/pages/{id}로 받아 보여 주므로 버킷은 공개하지 않는다.
import { DeleteObjectsCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ENV_KEYS = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;

export const flyerStorageConfigured = (): boolean => ENV_KEYS.every((key) => Boolean(process.env[key]?.trim()));

let client: S3Client | undefined;
const bucket = () => process.env.S3_BUCKET!;

function storage(): S3Client {
  if (!flyerStorageConfigured()) throw new Error("Flyer storage is not configured (S3_*)");
  // Garage는 리전 이름을 검사하지 않고 경로 방식 주소만 받는다.
  client ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "garage",
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
  });
  return client;
}

/** "flyers/{업로드 id}/{순서}.webp". 업로드마다 새 폴더라 다시 올려도 예전 이미지를 덮지 않는다. */
export const flyerImageKey = (uploadId: string, position: number) => `flyers/${uploadId}/${position}.webp`;

export async function putFlyerImage(key: string, image: Buffer, contentType: string): Promise<void> {
  await storage().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: image, ContentType: contentType }));
}

/** 없으면 undefined. */
export async function getFlyerImage(key: string): Promise<Buffer | undefined> {
  try {
    const result = await storage().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    return result.Body ? Buffer.from(await result.Body.transformToByteArray()) : undefined;
  } catch (error) {
    if (error instanceof NoSuchKey) return undefined;
    throw error;
  }
}

export async function deleteFlyerImages(keys: string[]): Promise<void> {
  // 한 번에 1,000개까지 지울 수 있다. 전단은 10장이라 한 번이면 된다.
  for (let start = 0; start < keys.length; start += 1000) {
    await storage().send(new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: keys.slice(start, start + 1000).map((Key) => ({ Key })), Quiet: true },
    }));
  }
}
