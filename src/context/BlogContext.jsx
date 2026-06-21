import React, { createContext, useContext, useState, useEffect } from "react";
import { getFromGas, postToGas } from "../utils/api";

const BlogContext = createContext(null);

export const useBlogs = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlogs must be used within a BlogProvider");
  }
  return context;
};

export const BlogProvider = ({ children }) => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const hasGasConfigError = !import.meta.env.VITE_GAS_API_URL;

  const fetchBlogs = async () => {
    if (hasGasConfigError) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFromGas("getBlogs");
      // Sort blogs by date descending
      const sortedBlogs = (data.blogs || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setBlogs(sortedBlogs);
    } catch (err) {
      setError(err.message || "Failed to load blog posts.");
    } finally {
      setIsLoading(false);
    }
  };

  const createBlog = async (blogData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postToGas({
        action: "create",
        ...blogData,
      });
      // Refresh list
      await fetchBlogs();
      return response.blog;
    } catch (err) {
      setError(err.message || "Failed to create blog post.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlog = async (blogData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postToGas({
        action: "update",
        ...blogData,
      });
      // Refresh list
      await fetchBlogs();
      return response.blog;
    } catch (err) {
      setError(err.message || "Failed to update blog post.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBlog = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      await postToGas({
        action: "delete",
        id,
      });
      // Filter out locally immediately for responsive feel
      setBlogs((prev) => prev.filter((blog) => blog.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete blog post.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <BlogContext.Provider
      value={{
        blogs,
        isLoading,
        error,
        hasGasConfigError,
        fetchBlogs,
        createBlog,
        updateBlog,
        deleteBlog,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
