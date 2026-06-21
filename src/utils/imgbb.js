/**
 * ImgBB image upload utility.
 * Uploads a base64 image to ImgBB — free forever, no credit card needed.
 *
 * Get a free API key in 30 seconds at: https://api.imgbb.com/
 *
 * Required env variable:
 *   VITE_IMGBB_API_KEY — your ImgBB API key
 */

/**
 * Uploads a base64 data URL to ImgBB.
 * @param {string} base64DataUrl - A data URL like "data:image/jpeg;base64,..."
 * @returns {Promise<string>} The permanent public image URL
 */
export const uploadToImgBB = async (base64DataUrl) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ImgBB is not configured. Add VITE_IMGBB_API_KEY to your .env file. Get a free key at https://api.imgbb.com/"
    );
  }

  // Strip the data:image/...;base64, prefix — ImgBB wants the raw base64 string
  const base64 = base64DataUrl.replace(/^data:image\/[a-z]+;base64,/, "");

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `ImgBB upload failed (HTTP ${response.status})`;
    try {
      const err = await response.json();
      message = err?.error?.message || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data = await response.json();

  if (data?.data?.url) {
    // Use display_url if available (direct image link without page wrapper)
    return data.data.display_url || data.data.url;
  }

  throw new Error("ImgBB did not return an image URL.");
};
