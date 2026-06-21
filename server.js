// server.js - AI Image Generation Proxy (ESM)
// Uses Pollinations.ai — completely free, no API key required
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS & request logging ----------
const ALLOWED_ORIGINS = [
  'http://localhost:5173',                         // local dev
  process.env.FRONTEND_URL,                        // set this on Render to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman) or matching origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
}));
app.use((req, res, next) => {
  console.log(`[AI Proxy] ${req.method} ${req.path}`);
  next();
});
app.use(express.json());
// ------------------------------------------

/**
 * POST /generate-image
 * Body: { prompt: string }
 * Returns: { imageDataUrl: "data:image/jpeg;base64,..." }
 *
 * Powered by Pollinations.ai — free AI image generation, no API key needed.
 */
app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const encodedPrompt = encodeURIComponent(prompt);
    // Pollinations.ai: generates real AI images (Stable Diffusion XL) for free
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Date.now()}`;

    console.log(`[AI Proxy] Generating image for: "${prompt.substring(0, 70)}..."`);

    const response = await axios.get(pollinationsUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30s timeout
    });

    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';

    console.log('[AI Proxy] Image generated successfully ✓');
    res.json({ imageDataUrl: `data:${mimeType};base64,${base64}` });
  } catch (err) {
    console.error('[AI Proxy] Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

app.listen(PORT, () => {
  console.log(`✨ AI Image Proxy listening at http://localhost:${PORT}`);
});
