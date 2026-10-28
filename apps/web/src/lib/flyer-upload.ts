// /flyer 입력 창을 제출한 뒤의 일: 슬랙에서 이미지를 받아 줄여 저장소에 올리고, 게시하고, 채널에 확인 메시지를 남긴다.
import { randomUUID } from "node:crypto";

import { sharedDb } from "../db/client";
import { MART_BRAND_LABELS } from "../db/codes";
import { publishFlyer, setFlyerMessageTs, type StoredFlyerPage } from "../db/flyers";
import { FlyerImageError, MAX_FLYER_INPUT_BYTES, toFlyerPageImage, type FlyerPageImage } from "./flyer-image";
import { deleteFlyerImages, flyerImageKey, putFlyerImage } from "./flyer-storage";
import { koreaToday, type FlyerUploadInput } from "./flyers";
import { callSlack, downloadSlackFile, flyerSummaryBlock, publishedFlyerBlocks, type SlackFile } from "./slack-flyers";

export async function uploadFlyer(input: FlyerUploadInput, files: SlackFile[], userId: string, channelId: string): Promise<void> {
  const label = MART_BRAND_LABELS[input.brand];
  const fail = (reason: string) => callSlack("chat.postMessage", { channel: channelId, text: `<@${userId}> ${label} 전단을 올리지 못했어요. ${reason}` });
  const uploadedKeys: string[] = [];
  try {
    const pages: FlyerPageImage[] = [];
    for (const [index, file] of files.entries()) {
      try {
        pages.push(await toFlyerPageImage(await downloadSlackFile(file, MAX_FLYER_INPUT_BYTES)));
      } catch (error) {
        if (error instanceof FlyerImageError) {
          await fail(`${index + 1}번째 이미지: ${error.message}`);
          return;
        }
        throw error;
      }
    }
    const uploadId = randomUUID();
    const stored: StoredFlyerPage[] = [];
    for (const [position, { image, ...page }] of pages.entries()) {
      const storageKey = flyerImageKey(uploadId, position);
      await putFlyerImage(storageKey, image, page.contentType);
      uploadedKeys.push(storageKey);
      stored.push({ storageKey, ...page });
    }
    const result = await publishFlyer(sharedDb(), input, stored, userId, koreaToday(new Date()));
    if (result.status !== "published") {
      await removeImages(uploadedKeys);
      await fail("브랜드가 DB에 없어요.");
      return;
    }
    // 게시됐으니 아래에서 실패해도 올린 이미지는 지우지 않는다.
    uploadedKeys.length = 0;
    await removeImages(result.deletedKeys);
    // 여기부터는 이미 게시됐다. 확인 메시지가 실패해도 "올리지 못했어요"라고 알리지 않는다.
    const summary = flyerSummaryBlock(input, pages.length, userId, result.replaced);
    try {
      const message = await callSlack<{ ts?: string }>("chat.postMessage", {
        channel: channelId,
        text: `${label} 전단 ${pages.length}장 게시`,
        blocks: publishedFlyerBlocks(summary, result.flyerId, input.brand),
      });
      if (message.ts) await setFlyerMessageTs(sharedDb(), result.flyerId, message.ts);
    } catch (error) {
      console.error("Flyer confirmation message failed", error);
    }
  } catch (error) {
    console.error("Flyer upload failed", error);
    await removeImages(uploadedKeys);
    await fail("잠시 뒤에 /flyer로 다시 올려 주세요.").catch((postError) => console.error("Slack failure notice failed", postError));
  }
}

/** 저장소 정리는 실패해도 게시 결과를 바꾸지 않는다. 남은 이미지는 DB에 키가 없어 보이지 않는다. */
async function removeImages(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await deleteFlyerImages(keys).catch((error) => console.error("Flyer image cleanup failed", error));
}
