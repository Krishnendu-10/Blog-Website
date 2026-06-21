/**
 * Utility functions for communicating with the Google Apps Script Web App.
 */

/**
 * Wrapper for GET requests to the GAS web app.
 * @param {string} action - Action name ('getBlogs' | 'getBlogContent')
 * @param {object} params - Additional query parameters
 */
export const getFromGas = async (action, params = {}) => {
  const url = import.meta.env.VITE_GAS_API_URL;
  if (!url) {
    throw new Error("Google Apps Script Web App URL is not configured. Please set VITE_GAS_API_URL in your .env file.");
  }

  const queryParams = new URLSearchParams({ action, ...params }).toString();
  
  try {
    const response = await fetch(`${url}?${queryParams}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const text = await response.text();
    const data = JSON.parse(text);

    if (!data.success) {
      throw new Error(data.error || "Failed to execute backend action");
    }

    return data;
  } catch (err) {
    console.error("GAS GET Error:", err);
    throw err;
  }
};

/**
 * Wrapper for POST requests to the GAS web app.
 * Sends payload as text/plain to bypass CORS preflight OPTIONS blocking.
 * @param {object} payload - JSON payload containing 'action' and action-specific fields
 */
export const postToGas = async (payload) => {
  const url = import.meta.env.VITE_GAS_API_URL;
  if (!url) {
    throw new Error("Google Apps Script Web App URL is not configured. Please set VITE_GAS_API_URL in your .env file.");
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const text = await response.text();
    const data = JSON.parse(text);

    if (!data.success) {
      throw new Error(data.error || "Failed to execute backend action");
    }

    return data;
  } catch (err) {
    console.error("GAS POST Error:", err);
    throw err;
  }
};
