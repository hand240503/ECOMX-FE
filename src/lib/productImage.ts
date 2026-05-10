import type { ProductDocumentAttachment, ProductFullResponse } from '../api/types/product.types';
import { API_V1_BASE_URL } from '../api/config/axiosConfig';

const ABSOLUTE_URL = /^https?:\/\//i;

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

function encodePathSegments(rel: string): string {
  return rel
    .split('/')
    .filter((seg) => seg.length > 0)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

/**
 * Chuẩn hóa `filePath` / phần tử `imageUrls` thành URL dùng được cho `img src`.
 * - URL tuyệt đối (`http://`, `https://`) giữ nguyên.
 * - Đường dẫn cục bộ `/uploads/...` hoặc `uploads/...` → `GET {apiBase}/document/{phần sau uploads}`.
 * - Đường dẫn tương đối không bắt đầu bằng `/` (vd. `260510/uuid.jpg`) → coi là phần sau thư mục upload.
 */
export function resolveImageSrc(
  filePath: string,
  apiBase: string = API_V1_BASE_URL
): string {
  const t = typeof filePath === 'string' ? filePath.trim() : '';
  if (!t) return t;
  if (ABSOLUTE_URL.test(t)) return t;

  const lower = t.toLowerCase();
  let rel = '';
  const uploadsIdx = lower.indexOf('/uploads/');
  if (uploadsIdx >= 0) {
    rel = t.slice(uploadsIdx + '/uploads/'.length);
  } else if (lower.startsWith('uploads/')) {
    rel = t.slice('uploads/'.length);
  } else if (!t.startsWith('/')) {
    rel = t;
  } else {
    return t;
  }

  if (!rel) return t;

  const base = stripTrailingSlashes(apiBase);
  return `${base}/document/${encodePathSegments(rel)}`;
}

function resolveOptional(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  return resolveImageSrc(s);
}

/** Ảnh gallery: `type` 1 hoặc legacy 0 — không gồm video 2 / tài liệu 3. */
export function documentKindIsGalleryImage(type: number): boolean {
  return type === 0 || type === 1;
}

/**
 * Document được đánh dấu cover — chỉ có nghĩa khi là ảnh gallery (`documentKindIsGalleryImage`).
 */
export function productDocumentIsMarkedMain(
  d: Pick<ProductDocumentAttachment, 'type' | 'isMain'>
): boolean {
  return documentKindIsGalleryImage(d.type) && d.isMain === true;
}

/**
 * Ảnh đại diện:
 * 1) `mainImageUrl` / các alias (BE đã enrich từ ảnh `isMain`).
 * 2) `documents`: `type` 0|1 và `isMain === true`.
 * 3) ảnh đầu gallery (`imageUrls` — main trước, hoặc fallback từ documents).
 */
export function getProductImageUrl(product: ProductFullResponse): string | undefined {
  for (const c of [
    product.mainImageUrl,
    product.imageUrl,
    product.coverImageUrl,
    product.thumbnailUrl,
  ]) {
    const r = resolveOptional(c);
    if (r) return r;
  }

  const docs = product.documents;
  if (Array.isArray(docs)) {
    const mainDoc = docs.find(
      (d) =>
        typeof d.filePath === 'string' &&
        d.filePath.trim() !== '' &&
        productDocumentIsMarkedMain(d)
    );
    if (mainDoc) {
      const r = resolveOptional(mainDoc.filePath);
      if (r) return r;
    }
  }

  return getProductImageUrls(product)[0];
}

/**
 * Gallery: `imageUrls` nếu có (giữ thứ tự BE: main trước); không thì ghép từ `documents` (ảnh 0|1, main trước rồi theo id); sau đó các trường ảnh đơn, dedupe.
 */
export function getProductImageUrls(product: ProductFullResponse): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const pushResolved = (raw: string | null | undefined) => {
    const r = resolveOptional(raw);
    if (!r || seen.has(r)) return;
    seen.add(r);
    out.push(r);
  };

  const rawList = product.imageUrls;
  if (Array.isArray(rawList) && rawList.length > 0) {
    for (const item of rawList) {
      pushResolved(typeof item === 'string' ? item : undefined);
    }
    if (out.length > 0) return out;
  }

  const docList = product.documents;
  if (Array.isArray(docList) && docList.length > 0) {
    const ordered = [...docList]
      .filter((d) => documentKindIsGalleryImage(d.type) && typeof d.filePath === 'string')
      .sort((a, b) => {
        const ma = a.isMain === true ? 1 : 0;
        const mb = b.isMain === true ? 1 : 0;
        if (mb !== ma) return mb - ma;
        return a.id - b.id;
      });
    for (const d of ordered) {
      pushResolved(d.filePath);
    }
    if (out.length > 0) return out;
  }

  for (const c of [
    product.mainImageUrl,
    product.thumbnailUrl,
    product.imageUrl,
    product.coverImageUrl,
  ]) {
    pushResolved(c);
  }

  return out;
}
