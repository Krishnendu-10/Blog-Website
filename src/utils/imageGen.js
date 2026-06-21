/**
 * AI image generation utility.
 * Routes requests through the local proxy server (server.js),
 * which uses Pollinations.ai — free, no API key required.
 */

/**
 * Generates a thumbnail image based on a prompt.
 * @param {string} prompt - Text description of the image to generate
 * @returns {Promise<string>} Base64 data URL of the generated image
 */
export const generateImage = async (prompt) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) {
    throw new Error("Backend URL is not configured. Set VITE_BACKEND_URL in .env.");
  }

  const url = `${backendUrl}/generate-image`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate thumbnail image";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.imageDataUrl) {
      return data.imageDataUrl;
    } else {
      throw new Error("No image data returned from AI service.");
    }
  } catch (err) {
    console.error("AI Image Generation Error:", err);
    throw err;
  }
};
