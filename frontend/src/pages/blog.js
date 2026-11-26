import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@layout/Layout";
import BlogServices from "@services/BlogServices";
import CMSkeleton from "@components/preloader/CMSkeleton";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const data = await BlogServices.getShowingBlogs();
        setBlogs(data || []);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const getTitle = (titleObj) => {
    if (typeof titleObj === "string") return titleObj;
    if (typeof titleObj === "object" && titleObj !== null) {
      return titleObj.en || titleObj[Object.keys(titleObj)[0]] || "";
    }
    return "";
  };

  return (
    <Layout title="Blog" description="Latest electronics guides, battery insights, and industry updates from Elecmoon">
      {/* Hero Section */}
      <div className="relative bg-[#0b1d3d] text-white py-16 lg:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4 bg-white/10 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#ED1C24]">Blog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black !text-white mb-4 tracking-tight">
            Elecmoon <span className="text-[#ED1C24]">Blog</span>
          </h1>
          <div className="w-20 h-1 bg-[#ED1C24] mx-auto mb-4 rounded-full" />
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Discover the latest news, component guides, lithium battery innovations, and engineering tips from the Elecmoon team.
          </p>
        </div>
      </div>

      {/* Blog Posts Section */}
      <div className="bg-white py-12 lg:py-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white">
                  <CMSkeleton count={1} height={200} loading={true} />
                  <div className="mt-6">
                    <CMSkeleton count={1} height={24} loading={true} />
                    <CMSkeleton count={1} height={16} loading={true} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 text-lg">Error loading blogs: {error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No blog posts available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {blogs.map((blog) => (
                <div
                  key={blog._id}
                  className="bg-white group"
                >
                  <Link href={`/blog/${blog.slug}`}>
                    <div className="relative w-full h-[200px] lg:h-[250px] overflow-hidden mb-6">
                      {blog.image ? (
                        <Image
                          src={blog.image}
                          alt={getTitle(blog.title)}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-300 leading-tight">
                        {getTitle(blog.title)}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-4">
                      {formatDate(blog.publishedAt || blog.createdAt)}
                    </p>
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-sm transition-colors duration-300"
                    >
                      Read More <span className="ml-1">»</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;

