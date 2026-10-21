import { createCatalog, type Catalog, type CatalogSnapshot } from "./catalog";
import { loadJsonSnapshot } from "./json-source";

// 레플리카가 1개라 프로세스 메모리 캐시로 충분하다. 데이터를 고친 뒤에는 /api/revalidate로 바로 다시 읽는다.
const TTL_MS = 60 * 60 * 1000;

export type CatalogSource = "json" | "db";

export const catalogSource = (): CatalogSource => (process.env.CATALOG_SOURCE === "db" ? "db" : "json");

async function readSnapshot(): Promise<CatalogSnapshot> {
  if (catalogSource() === "json") return loadJsonSnapshot();
  const [{ sharedDb }, { readDbSnapshot }] = await Promise.all([import("../../db/client"), import("../../db/snapshot")]);
  return readDbSnapshot(sharedDb());
}

interface CatalogState {
  cached?: { catalog: Catalog; loadedAt: number };
  pending?: Promise<Catalog>;
}

// 라우트 번들마다 모듈이 따로 올라와도 캐시는 프로세스에 하나만 둔다.
const state: CatalogState = ((globalThis as { __jangnalCatalog?: CatalogState }).__jangnalCatalog ??= {});

/** 새로 읽어 캐시를 바꾼다. 실패하면 기존 캐시를 그대로 두고 에러를 던진다. */
export function refreshCatalog(): Promise<Catalog> {
  state.pending ??= readSnapshot()
    .then((snapshot) => {
      const catalog = createCatalog(snapshot);
      state.cached = { catalog, loadedAt: Date.now() };
      return catalog;
    })
    .finally(() => {
      state.pending = undefined;
    });
  return state.pending;
}

/**
 * 시장 데이터 스냅샷. 1시간이 지나면 기존 스냅샷으로 응답하면서 뒤에서 다시 읽는다.
 * 캐시가 비어 있을 때 읽기에 실패하면 에러를 던진다.
 */
export async function loadCatalog(): Promise<Catalog> {
  const { cached } = state;
  if (!cached) return refreshCatalog();
  if (Date.now() - cached.loadedAt >= TTL_MS) {
    refreshCatalog().catch((error) => console.error("Catalog refresh failed; serving the previous snapshot", error));
  }
  return cached.catalog;
}
