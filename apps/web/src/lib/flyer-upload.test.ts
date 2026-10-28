import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publishFlyer: vi.fn(),
  setFlyerMessageTs: vi.fn(async () => undefined),
  putFlyerImage: vi.fn(async (_key: string, _image: Buffer, _contentType: string) => undefined),
  deleteFlyerImages: vi.fn(async (_keys: string[]) => undefined),
  callSlack: vi.fn(async () => ({ ok: true, ts: "1.2" })),
}));

vi.mock("../db/client", () => ({ sharedDb: () => ({}) }));
vi.mock("../db/flyers", () => ({ publishFlyer: mocks.publishFlyer, setFlyerMessageTs: mocks.setFlyerMessageTs }));
vi.mock("./flyer-storage", () => ({
  flyerImageKey: (uploadId: string, position: number) => `flyers/${uploadId}/${position}.webp`,
  putFlyerImage: mocks.putFlyerImage,
  deleteFlyerImages: mocks.deleteFlyerImages,
}));
vi.mock("./flyer-image", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./flyer-image")>()),
  toFlyerPageImage: async (input: Buffer) => ({ image: input, contentType: "image/webp", width: 10, height: 20, byteSize: input.length }),
}));
vi.mock("./slack-flyers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./slack-flyers")>()),
  callSlack: mocks.callSlack,
  downloadSlackFile: async (file: { id: string }) => Buffer.from(file.id),
}));

import { uploadFlyer } from "./flyer-upload";

const input = { brand: "emart" as const, startsOn: "2026-10-29", endsOn: "2026-11-04", baseStoreName: null };
const files = [{ id: "a" }, { id: "bb" }];

describe("uploadFlyer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("puts each page in storage, publishes the keys, then removes expired images", async () => {
    mocks.publishFlyer.mockResolvedValue({ status: "published", flyerId: "F1", replaced: 0, deleted: 1, deletedKeys: ["flyers/old/0.webp"] });
    await uploadFlyer(input, files, "U1", "C1");

    const keys = mocks.putFlyerImage.mock.calls.map(([key]) => key);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^flyers\/[0-9a-f-]{36}\/0\.webp$/);
    expect(keys[1]).toBe(keys[0].replace("/0.webp", "/1.webp"));
    const [, , stored] = mocks.publishFlyer.mock.calls[0] as unknown as [unknown, unknown, { storageKey: string; byteSize: number }[]];
    expect(stored).toEqual([
      { storageKey: keys[0], contentType: "image/webp", width: 10, height: 20, byteSize: 1 },
      { storageKey: keys[1], contentType: "image/webp", width: 10, height: 20, byteSize: 2 },
    ]);
    expect(mocks.deleteFlyerImages).toHaveBeenCalledExactlyOnceWith(["flyers/old/0.webp"]);
    expect(mocks.setFlyerMessageTs).toHaveBeenCalledWith({}, "F1", "1.2");
  });

  it("removes the images it put when publishing fails", async () => {
    mocks.publishFlyer.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await uploadFlyer(input, files, "U1", "C1");

    const keys = mocks.putFlyerImage.mock.calls.map(([key]) => key);
    expect(mocks.deleteFlyerImages).toHaveBeenCalledExactlyOnceWith(keys);
    expect(JSON.stringify(mocks.callSlack.mock.calls.at(-1))).toContain("올리지 못했어요");
  });
});
