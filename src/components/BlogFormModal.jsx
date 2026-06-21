import React, { useState, useEffect } from "react";
import { X, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { generateImage } from "../utils/imageGen";

const CATEGORIES = [
  "Technology",
  "Design",
  "Business",
  "Lifestyle",
  "Travel",
  "Creative",
];

export const BlogFormModal = ({ isOpen, onClose, onSubmit, blogToEdit }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [slug, setSlug] = useState("");
  
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  // Populate form if editing
  useEffect(() => {
    if (blogToEdit) {
      setTitle(blogToEdit.title || "");
      setCategory(blogToEdit.category || CATEGORIES[0]);
      setContent(blogToEdit.content || ""); // Note: we'll fetch content if not in list, but let's handle editing.
      setImageBase64(blogToEdit.imageUrl || ""); // Can display existing image URL too!
      setSlug(blogToEdit.slug || "");
      setCustomPrompt("");
    } else {
      setTitle("");
      setCategory(CATEGORIES[0]);
      setContent("");
      setImageBase64("");
      setSlug("");
      setCustomPrompt("");
    }
    setImageError("");
  }, [blogToEdit, isOpen]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!blogToEdit) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  }, [title, blogToEdit]);

  if (!isOpen) return null;

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleSlugChange = (e) => {
    // If they want to customize the slug
    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleGenerateThumbnail = async () => {
    const promptText = customPrompt.trim() 
      || `A beautiful and minimal modern editorial feature banner illustration for a blog post titled "${title}" in the category of "${category}". Professional digital art style.`;
    
    setIsGeneratingImage(true);
    setImageError("");
    try {
      const base64Url = await generateImage(promptText, title, category);
      setImageBase64(base64Url);
    } catch (err) {
      setImageError(err.message || "Failed to generate thumbnail.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !category || !content.trim() || !slug.trim()) {
      return;
    }
    if (!imageBase64) {
      setImageError("Please generate a thumbnail image using AI.");
      return;
    }

    const payload = {
      title,
      category,
      content,
      imageBase64,
      slug,
    };

    if (blogToEdit) {
      payload.id = blogToEdit.id;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl glass-panel text-white shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400 fill-violet-400/20" />
            {blogToEdit ? "Edit Blog Post" : "Create New Blog Post"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Text Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Blog Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={handleTitleChange}
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
                    onChange={handleSlugChange}
                    placeholder="my-blog-post"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600 text-sm text-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Content (Markdown / Plain Text)
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

            {/* Right side: AI Thumbnail Section */}
            <div className="flex flex-col h-full bg-slate-950/30 rounded-2xl border border-white/5 p-5 justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-violet-400" />
                  AI Thumbnail Generator
                </h3>
                
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Generate a breathtaking, custom 16:9 thumbnail for your article. 
                  Provide a prompt, or leave it blank to automatically design one using your title and category.
                </p>

                <div className="mb-4">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe the image... (e.g. 'A futuristic city glowing in dark purple cybernetic lights, synthwave neon watercolor')"
                    rows={3}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600 resize-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isGeneratingImage || (!title.trim() && !customPrompt.trim())}
                  onClick={handleGenerateThumbnail}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-950/20 active:scale-98"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-violet-200" />
                      AI is generating image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-violet-200" />
                      Generate Thumbnail
                    </>
                  )}
                </button>
              </div>

              {/* Preview Box */}
              <div className="mt-4 flex-1 flex flex-col justify-center items-center rounded-xl border border-dashed border-white/10 bg-slate-950/50 overflow-hidden relative min-h-[180px]">
                {isGeneratingImage ? (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    <span className="text-xs text-gray-400 font-serif italic">"Imagining art for your blog..."</span>
                  </div>
                ) : imageBase64 ? (
                  <div className="group w-full h-full relative aspect-video">
                    <img
                      src={imageBase64}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-xs text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                        AI Generated Thumbnail
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500 p-4 text-center">
                    <ImageIcon className="w-10 h-10 stroke-1 text-gray-600" />
                    <span className="text-xs">No image generated yet</span>
                  </div>
                )}
              </div>

              {imageError && (
                <p className="mt-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2 rounded-lg">
                  {imageError}
                </p>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 font-medium text-sm text-gray-300 transition-all active:scale-98 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGeneratingImage || !title.trim() || !content.trim() || !imageBase64}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-950/20 active:scale-98 cursor-pointer"
            >
              {blogToEdit ? "Save Changes" : "Publish Post"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
