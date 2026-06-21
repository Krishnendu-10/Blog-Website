import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, Image as ImageIcon, Loader2, Upload, CheckCircle2, UploadCloud } from "lucide-react";
import { generateImage } from "../utils/imageGen";
import { uploadToImgBB } from "../utils/imgbb";

const CATEGORIES = [
  "Technology",
  "Design",
  "Business",
  "Lifestyle",
  "Travel",
  "Creative",
];

/* ─── Upload progress states ─────────────────────────────────────── */
// null        → idle (no image yet)
// "generating"→ Pollinations AI is generating
// "uploading" → uploading to Cloudinary
// "done"      → Cloudinary URL is ready
// "error"     → something failed

export const BlogFormModal = ({ isOpen, onClose, onSubmit, blogToEdit }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Image state
  const [imageUrl, setImageUrl] = useState("");        // Final Cloudinary URL stored here
  const [previewSrc, setPreviewSrc] = useState("");    // data URL shown in preview (before upload finishes)
  const [uploadState, setUploadState] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState("");

  const fileInputRef = useRef(null);

  /* ── Populate when editing ── */
  useEffect(() => {
    if (blogToEdit) {
      setTitle(blogToEdit.title || "");
      setCategory(blogToEdit.category || CATEGORIES[0]);
      setContent(blogToEdit.content || "");
      setSlug(blogToEdit.slug || "");
      setCustomPrompt("");
      // Show existing image
      setImageUrl(blogToEdit.imageUrl || "");
      setPreviewSrc(blogToEdit.imageUrl || "");
      setUploadState(blogToEdit.imageUrl ? "done" : null);
    } else {
      setTitle("");
      setCategory(CATEGORIES[0]);
      setContent("");
      setSlug("");
      setCustomPrompt("");
      setImageUrl("");
      setPreviewSrc("");
      setUploadState(null);
    }
    setImageError("");
    setUploadProgress(0);
  }, [blogToEdit, isOpen]);

  /* ── Auto-generate slug from title ── */
  useEffect(() => {
    if (!blogToEdit) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [title, blogToEdit]);

  if (!isOpen) return null;

  /* ── Upload a base64 data URL to ImgBB ── */
  const handleImgBBUpload = async (base64DataUrl) => {
    setUploadState("uploading");
    setImageError("");
    try {
      const url = await uploadToImgBB(base64DataUrl);
      setImageUrl(url);
      setUploadState("done");
    } catch (err) {
      setImageError(err.message || "Failed to upload image to ImgBB.");
      setUploadState("error");
      setImageUrl("");
    }
  };

  /* ── AI Thumbnail generation ── */
  const handleGenerateThumbnail = async () => {
    const promptText =
      customPrompt.trim() ||
      `A beautiful and minimal modern editorial feature banner illustration for a blog post titled "${title}" in the category of "${category}". Professional digital art style.`;

    setUploadState("generating");
    setImageError("");
    setPreviewSrc("");
    setImageUrl("");
    setUploadProgress(0);

    try {
      const base64Url = await generateImage(promptText);
      setPreviewSrc(base64Url);          // Show preview immediately
      await handleImgBBUpload(base64Url);
    } catch (err) {
      setImageError(err.message || "Failed to generate thumbnail.");
      setUploadState("error");
    }
  };

  /* ── Manual file upload ── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setImageError("Please select a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Image must be smaller than 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setPreviewSrc(base64);
      await handleImgBBUpload(base64);
    };
    reader.readAsDataURL(file);
  };

  /* ── Form submission ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !category || !content.trim() || !slug.trim()) return;

    if (!imageUrl) {
      setImageError("Please generate or upload a thumbnail image.");
      return;
    }

    const payload = {
      title,
      category,
      content,
      imageUrl,   // Cloudinary URL — GAS no longer receives base64
      slug,
    };

    if (blogToEdit) {
      payload.id = blogToEdit.id;
    }

    onSubmit(payload);
  };

  const isBusy = uploadState === "generating" || uploadState === "uploading";

  /* ── Status label in preview box ── */
  const statusLabel = () => {
    if (uploadState === "generating") return "AI is generating image…";
    if (uploadState === "uploading") return "Uploading to ImgBB…";
    if (uploadState === "done") return "Image ready ✓";
    if (uploadState === "error") return "Upload failed — try again";
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl glass-panel text-white shadow-2xl overflow-hidden my-8">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400 fill-violet-400/20" />
            {blogToEdit ? "Edit Blog Post" : "Create New Blog Post"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Left: Text fields ── */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Blog Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 focus:border-violet-500 focus:outline-none transition-all text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                    }
                    placeholder="my-blog-post"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600 text-sm text-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Content (Plain Text)
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your creative thoughts here..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600 resize-none font-sans text-base leading-relaxed"
                />
              </div>
            </div>

            {/* ── Right: Image panel ── */}
            <div className="flex flex-col bg-slate-950/30 rounded-2xl border border-white/5 p-5 gap-4">

              {/* Section title */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  Thumbnail
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Generate with AI or upload your own image. Hosted on ImgBB — free, permanent CDN.
                </p>
              </div>

              {/* AI prompt textarea */}
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Optional AI prompt — e.g. 'A futuristic city in neon cyberpunk purple'"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600 resize-none"
              />

              {/* Buttons row */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isBusy || (!title.trim() && !customPrompt.trim())}
                  onClick={handleGenerateThumbnail}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-violet-950/20 active:scale-95"
                >
                  {uploadState === "generating" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> AI Generate</>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 active:scale-95"
                >
                  {uploadState === "uploading" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" /> Upload File</>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Preview box */}
              <div className="flex-1 flex flex-col justify-center items-center rounded-xl border border-dashed border-white/10 bg-slate-950/50 overflow-hidden relative min-h-[180px]">

                {isBusy && !previewSrc ? (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    <span className="text-xs text-gray-400 font-serif italic">
                      {statusLabel()}
                    </span>
                  </div>
                ) : previewSrc ? (
                  <div className="group w-full h-full relative">
                    <img
                      src={previewSrc}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Status overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-3 pointer-events-none">
                      {uploadState === "uploading" && (
                        <span className="text-[11px] text-white bg-black/70 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                          <UploadCloud className="w-3 h-3 animate-pulse" />
                          Uploading to ImgBB…
                        </span>
                      )}
                      {uploadState === "done" && (
                        <span className="text-[11px] text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Saved to ImgBB CDN
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600 p-6 text-center">
                    <ImageIcon className="w-10 h-10 stroke-1" />
                    <span className="text-xs">Generate with AI or upload an image</span>
                  </div>
                )}
              </div>

              {imageError && (
                <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-xl leading-relaxed">
                  {imageError}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 font-medium text-sm text-gray-300 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !title.trim() || !content.trim() || !imageUrl}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-950/20 active:scale-95 cursor-pointer"
            >
              {blogToEdit ? "Save Changes" : "Publish Post"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
