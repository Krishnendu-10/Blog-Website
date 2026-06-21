import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBlogs } from "../context/BlogContext";
import { BlogFormModal } from "../components/BlogFormModal";
import { getFromGas } from "../utils/api";
import { Plus, Search, Edit2, Trash2, Calendar, BookOpen, AlertTriangle } from "lucide-react";

export const BlogIndex = () => {
  const { blogs, isLoading, error, createBlog, updateBlog, deleteBlog, hasGasConfigError } = useBlogs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  // Categories list
  const categories = ["All", "Technology", "Design", "Business", "Lifestyle", "Travel", "Creative"];

  // Filter posts
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenCreateModal = () => {
    setEditingBlog(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog, e) => {
    e.preventDefault();
    e.stopPropagation();
    // We pass the blog info to edit. Note that in a production app we'd fetch full content if it isn't in index,
    // but since we keep the blog object, we can request GAS to get document content when opening detail or editing.
    // In our case, we can pass blog but we need the original content for editing.
    // Wait! Let's fetch the full blog content from GAS before editing!
    // Let's implement a fetch helper in the form modal, or fetch here and set state.
    // Let's fetch the content from GAS.
    setEditingBlog({ ...blog, content: "Loading content from Google Doc..." });
    setIsModalOpen(true);

    // Call GAS to get document content
    getFromGas("getBlogContent", { docId: blog.docId })
      .then((res) => {
        if (res.success && res.content) {
          // Check if modal is still editing this blog
          setEditingBlog((prev) => {
            if (prev && prev.id === blog.id) {
              // Extract text from HTML, or use the raw body. 
              // Wait, DocumentApp body.getText() returns plain text. But GAS export format=html returns HTML.
              // Google Docs content is stored as doc text. Let's see: in GAS Code.gs, when we create,
              // we set text using body.setText(content). When we update, we do body.setText(content).
              // So the original content is plain text split by paragraphs!
              // When exporting as HTML, we get HTML tags.
              // To edit, it is best to get the plain text content!
              // Wait! Can we extract plain text in GAS?
              // In Code.gs, we didn't add a text getter, but DocumentApp.openById(docId).getBody().getText() is standard!
              // Let's modify Code.gs to return plain text for editing if we need it, or we can strip HTML in React.
              // Actually, wait! In GAS Code.gs, the getBlogDocContent function returns HTML body and styles.
              // For editing, let's strip HTML tags or retrieve text.
              // Wait, let's see. If we strip HTML tags in React, it's very simple.
              // Or, in Code.gs, we can easily return both the HTML AND the plain text!
              // Let's check how we can do this. The user can edit using standard text.
              // Let's write a simple helper to strip HTML tags in React:
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = res.content.body;
              // Clean up paragraphs with double newlines
              const paragraphs = Array.from(tempDiv.querySelectorAll("p")).map(p => p.textContent);
              const textContent = paragraphs.join("\n");
              return { ...prev, content: textContent || tempDiv.textContent };
            }
            return prev;
          });
        }
      })
      .catch((err) => {
        console.error("Error loading blog text content:", err);
        setEditingBlog((prev) =>
          prev && prev.id === blog.id ? { ...prev, content: "Error fetching post content." } : prev
        );
      });
  };

  const handleDeletePost = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this blog post? This will trash the associated Google Doc and image file.")) {
      try {
        await deleteBlog(id);
      } catch (err) {
        alert(err.message || "Failed to delete post");
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingBlog) {
        await updateBlog(formData);
      } else {
        await createBlog(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Errors are handled inside the modal or context
    }
  };

  return (
    <div className="min-h-screen pb-16 bg-[#0b0f19] text-white">
      {/* Configuration Error Banner */}
      {hasGasConfigError && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 p-4 text-amber-200">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Google Apps Script URL is missing</h4>
              <p className="text-xs text-amber-300/80 mt-1">
                Your frontend is running in sandbox mode because `VITE_GAS_API_URL` is empty in your `.env` file. 
                Please deploy your Apps Script (`Code.gs`) as a Web App, configure the environment variables, and restart the server to enable live sync.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 px-6 border-b border-white/5 bg-gradient-to-b from-slate-950 to-[#0b0f19]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-violet-950/50 border border-violet-800/30 text-violet-300">
            <Plus className="w-3 h-3 text-violet-400" /> Serverless Blog Engine
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-extrabold tracking-tight text-white leading-none">
            Ink & <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Insight</span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg font-light leading-relaxed">
            An AI-augmented blog platform powered entirely by React, Google Apps Script, Google Drive, and AI-generated thumbnails.
          </p>

          {!hasGasConfigError && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-950/30 active:scale-98 flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Write New Article
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-8">
        
        {/* Controls: Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-all placeholder:text-gray-600 text-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-950/20"
                    : "bg-slate-950/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {isLoading && blogs.length === 0 ? (
          /* Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-white/5 bg-slate-900/20 aspect-video overflow-hidden animate-pulse flex flex-col justify-between p-6 h-[400px]">
                <div className="w-full h-48 bg-slate-950/50 rounded-xl mb-4" />
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-slate-950/50 rounded w-1/4" />
                  <div className="h-6 bg-slate-950/50 rounded w-3/4" />
                  <div className="h-4 bg-slate-950/50 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/10 rounded-3xl border border-dashed border-white/5">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto stroke-1 mb-4" />
            <h3 className="text-lg font-serif font-semibold text-gray-400">No Articles Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2">
              {blogs.length === 0 
                ? "You haven't written any posts yet. Click the create button above to start your blog journey!" 
                : "Try adjusting your search criteria or choosing a different category filter."}
            </p>
          </div>
        ) : (
          /* Grid list of blogs */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl glass-panel border border-white/5 hover:border-violet-500/20 shadow-xl transition-all duration-300 hover:-translate-y-1 h-[420px]"
              >
                {/* Image Section */}
                <Link to={`/${blog.slug}`} className="block overflow-hidden aspect-video h-48 relative">
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur border border-white/10 text-violet-300">
                    {blog.category}
                  </span>
                </Link>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(blog.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <Link to={`/${blog.slug}`}>
                      <h3 className="text-lg font-serif font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-2 leading-snug">
                        {blog.title}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-sm mt-2 line-clamp-3 leading-relaxed">
                      {blog.excerpt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                    <Link
                      to={`/${blog.slug}`}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      Read Article <BookOpen className="w-3.5 h-3.5" />
                    </Link>
                    
                    {!hasGasConfigError && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditModal(blog, e)}
                          title="Edit Post"
                          className="p-2 rounded-lg bg-white/5 hover:bg-violet-900/30 text-gray-400 hover:text-violet-300 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(blog.id, e)}
                          title="Delete Post"
                          className="p-2 rounded-lg bg-white/5 hover:bg-rose-900/30 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Write/Edit Form Modal */}
      <BlogFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        blogToEdit={editingBlog}
      />
    </div>
  );
};
