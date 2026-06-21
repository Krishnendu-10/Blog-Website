import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BlogProvider } from "./context/BlogContext";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogArticle } from "./pages/BlogArticle";

function App() {
  return (
    <BlogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BlogIndex />} />
          <Route path="/:slug" element={<BlogArticle />} />
        </Routes>
      </BrowserRouter>
    </BlogProvider>
  );
}

export default App;
