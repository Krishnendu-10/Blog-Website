/**
 * Converts any Google Drive file URL into the stable thumbnail URL format.
 * The `uc?export=view` format is unreliable and often redirects to an HTML page.
 * The `thumbnail?id=...&sz=w1280` format is stable and does not require auth.
 *
 * @param {string} url - The original Google Drive image URL
 * @param {number} [width=1280] - Desired image width
 * @returns {string} A stable Google Drive thumbnail URL
 */
export const getDriveImageUrl = (url, width = 1280) => {
  if (!url) return "";

  // Already in thumbnail format — just ensure correct width
  const thumbMatch = url.match(/drive\.google\.com\/thumbnail\?.*id=([\w-]+)/);
  if (thumbMatch) {
    return `https://drive.google.com/thumbnail?id=${thumbMatch[1]}&sz=w${width}`;
  }

  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  // or:    https://drive.google.com/uc?id=FILE_ID&export=view
  const ucMatch = url.match(/[?&]id=([\w-]+)/);
  if (ucMatch) {
    return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w${width}`;
  }

  // Format: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([\w-]+)\//);
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w${width}`;
  }

  // Fallback: return the original URL unchanged
  return url;
};
