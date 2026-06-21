/**
 * Utility functions for communicating with the Google Gemini API.
 */

/**
 * Generates an image based on a prompt using the Gemini Imagen 3 model.
 * @param {string} prompt - Text description of the image to generate
 * @returns {Promise<string>} Base64 data URL of the generated image (JPEG)
 */
export const generateImage = async (prompt) => {
// Frontend now proxies Gemini image generation via backend server
// Validate backend URL
const backendUrl = import.meta.env.VITE_BACKEND_URL;
if (!backendUrl) {
  throw new Error("Backend URL is not configured. Set VITE_BACKEND_URL in .env.");
}

// No direct Gemini API key needed on frontend

  const url = `${backendUrl}/generate-image`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "16:9", // Modern widescreen banner format
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate thumbnail image";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.imageDataUrl) {
      return data.imageDataUrl; // already a full data:image/... URL
    } else {
      throw new Error("No image data returned from Gemini API.");
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
};
