import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBlogs } from "../context/BlogContext";
import { getFromGas } from "../utils/api";
import { ArrowLeft, Calendar, User, BookOpen, Loader2, Sparkles } from "lucide-react";

export const BlogArticle = () => {
  const { slug } = useParams();
  const { blogs, isLoading: isBlogsLoading } = useBlogs();
  const [docContent, setDocContent] = useState(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  // Find the blog post based on the slug
  const blog = blogs.find((b) => b.slug === slug);

  useEffect(() => {
    if (!blog) return;

    const fetchContent = async () => {
      setIsDocLoading(true);
      setDocError("");
      try {
        const data = await getFromGas("getBlogContent", { docId: blog.docId });
        if (data.success && data.content) {
          setDocContent(data.content);
        } else {
          setDocError("Could not retrieve text content from the Google Doc.");
        }
      } catch (err) {
        setDocError(err.message || "Failed to fetch content from Google Apps Script.");
      } finally {
        setIsDocLoading(false);
      }
    };

    fetchContent();
  }, [blog]);

  // Loading state for blogs lists
  if (isBlogsLoading && !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-gray-400 font-serif italic">Loading article...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!blog && !isBlogsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] px-6 text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Article Not Found</h2>
        <p className="text-gray-400 max-w-md mb-6">
          The blog post with slug <code className="text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded">/{slug}</code> does not exist or has been deleted.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all active:scale-98 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] pb-24 text-white">
      {/* Scope Style Injector for Google Doc Stylesheet */}
      {docContent?.styles && (
        <style dangerouslySetInnerHTML={{ __html: docContent.styles }} />
      )}

      {/* Article Navigation Header */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-900 border border-white/10 text-violet-300">
            {blog.category}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Title and Metadata */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-400 text-xs md:text-sm border-b border-white/5 pb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              {new Date(blog.date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-500" />
              By Guest Writer
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-gray-500" />
              5 min read
            </span>
          </div>
        </div>

        {/* Hero Banner Image */}
        <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl aspect-video max-h-[480px]">
          <img
            src={blog.imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="bg-slate-900/20 rounded-2xl border border-white/5 p-6 md:p-10 relative overflow-hidden backdrop-blur-sm">
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />

          {isDocLoading ? (
            /* Document Content Skeletons */
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-4 bg-slate-950/50 rounded w-full" />
              <div className="h-4 bg-slate-950/50 rounded w-11/12" />
              <div className="h-4 bg-slate-950/50 rounded w-full" />
              <div className="h-4 bg-slate-950/50 rounded w-5/6" />
              <div className="h-4 bg-slate-950/50 rounded w-2/3 mt-8" />
              <div className="h-4 bg-slate-950/50 rounded w-full mt-4" />
              <div className="h-4 bg-slate-950/50 rounded w-11/12" />
            </div>
          ) : docError ? (
            <div className="text-center py-12">
              <p className="text-rose-400 font-medium mb-3">{docError}</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                If the document was deleted or its permissions were modified in Google Drive, the script won't be able to access the text.
              </p>
            </div>
          ) : docContent ? (
            /* Rendered Google Doc content with local styles */
            <div 
              className="google-doc-content prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: docContent.body }} 
            />
          ) : (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-gray-600 stroke-1" />
              <p className="text-gray-500 text-sm">No content found inside the blog document.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
