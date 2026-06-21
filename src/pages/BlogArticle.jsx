import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useBlogs } from "../context/BlogContext";
import { getFromGas } from "../utils/api";
import { getDriveImageUrl } from "../utils/driveImage";
import {
  ArrowLeft,
  Calendar,
  User,
  BookOpen,
  Loader2,
  Sparkles,
  Clock,
  Tag,
} from "lucide-react";

/* ─── Reading Progress Bar ─────────────────────────────────────────── */
const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-50 bg-slate-900/60">
      <div
        className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

/* ─── Estimated read time ───────────────────────────────────────────── */
const estimateReadTime = (htmlBody = "") => {
  const text = htmlBody.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/* ─── Main Component ─────────────────────────────────────────────────── */
export const BlogArticle = () => {
  const { slug } = useParams();
  const { blogs, isLoading: isBlogsLoading } = useBlogs();
  const [docContent, setDocContent] = useState(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const contentRef = useRef(null);

  const blog = blogs.find((b) => b.slug === slug);

  useEffect(() => {
    if (!blog) return;
    setDocContent(null);
    setDocError("");
    setIsDocLoading(true);

    getFromGas("getBlogContent", { docId: blog.docId })
      .then((data) => {
        if (data.success && data.content) {
          setDocContent(data.content);
        } else {
          setDocError("Could not retrieve text content from the Google Doc.");
        }
      })
      .catch((err) => {
        setDocError(err.message || "Failed to fetch content from Google Apps Script.");
      })
      .finally(() => setIsDocLoading(false));
  }, [blog]);

  /* ── Loading ── */
  if (isBlogsLoading && !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <p className="text-gray-400 font-serif italic text-sm">Loading article…</p>
        </div>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!blog && !isBlogsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-950/30 border border-rose-800/30 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-rose-400 stroke-1" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Article Not Found</h2>
        <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
          The blog post{" "}
          <code className="text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded text-xs">
            /{slug}
          </code>{" "}
          does not exist or has been deleted.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-950/30 active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const readTime = docContent ? estimateReadTime(docContent.body) : 5;

  return (
    <div className="min-h-screen bg-[#0b0f19] pb-28 text-white">
      {/* Reading progress — fixed at very top */}
      <ReadingProgressBar />

      {/* ── Sticky nav header ── */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Articles
          </Link>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-violet-950/50 border border-violet-800/30 text-violet-300">
            <Tag className="w-3 h-3" />
            {blog.category}
          </span>
        </div>
      </header>

      {/* ── Hero section with full-bleed image ── */}
      <div className="relative w-full h-[55vh] min-h-[320px] max-h-[520px] overflow-hidden">
        <img
          src={getDriveImageUrl(blog.imageUrl)}
          alt={blog.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement.style.background =
              "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #0f172a 100%)";
          }}
        />
        {/* Multi-layer gradient overlay so title is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* Floating title over the image */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight drop-shadow-2xl">
            {blog.title}
          </h1>
        </div>
      </div>

      {/* ── Meta strip ── */}
      <div className="max-w-4xl mx-auto px-6 -mt-1">
        <div className="flex flex-wrap items-center gap-5 text-gray-400 text-xs md:text-sm border-b border-white/5 pb-6 pt-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
            {new Date(blog.date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-violet-400 shrink-0" />
            By Guest Writer
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-violet-400 shrink-0" />
            {readTime} min read
          </span>
        </div>
      </div>

      {/* ── Article body ── */}
      <main className="max-w-4xl mx-auto px-6 mt-8">
        <div className="relative rounded-2xl border border-white/5 overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/6 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative p-6 md:p-12 lg:p-16">
            {isDocLoading ? (
              /* Skeleton */
              <div className="space-y-4 py-4 animate-pulse">
                {[100, 92, 98, 84, 0, 96, 88, 100, 76].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 bg-slate-800/60 rounded"
                    style={{ width: `${w || 0}%`, marginTop: i === 4 ? "2rem" : undefined }}
                  />
                ))}
              </div>
            ) : docError ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800/30 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 text-rose-400 stroke-1" />
                </div>
                <p className="text-rose-400 font-medium">{docError}</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  If the document was deleted or its permissions changed in Google Drive, the
                  script won't be able to access the text.
                </p>
              </div>
            ) : docContent ? (
              <div
                ref={contentRef}
                className="google-doc-content"
                dangerouslySetInnerHTML={{ __html: docContent.body }}
              />
            ) : (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <Sparkles className="w-10 h-10 text-gray-600 stroke-1" />
                <p className="text-gray-500 text-sm">No content found inside the blog document.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer nav ── */}
        <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 text-sm text-gray-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to all articles
          </Link>

          <span className="text-xs text-gray-600 italic font-serif">
            Ink &amp; Insight
          </span>
        </div>
      </main>
    </div>
  );
};
