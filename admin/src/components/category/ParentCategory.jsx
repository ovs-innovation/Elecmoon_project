import React, { useState, useEffect } from "react";
import CategoryServices from "@/services/CategoryServices";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifySuccess } from "@/utils/toast";
import { FiX, FiChevronDown } from "react-icons/fi";

const ParentCategory = ({
  selectedCategory,
  setSelectedCategory,
  setDefaultCategory,
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { showingTranslateValue } = useUtilsFunction();

  // Flatten nested categories into a flat list with level indicators
  const flattenCategories = (cats, level = 0, result = []) => {
    for (const cat of cats) {
      const name = showingTranslateValue(cat.name) || cat.name || "Unnamed";
      result.push({ _id: cat._id, name, level, rawName: cat.name });
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, level + 1, result);
      }
    }
    return result;
  };

  useEffect(() => {
    setLoading(true);
    CategoryServices.getAllCategory()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setCategories(arr);
        setLoading(false);
      })
      .catch(() => {
        setCategories([]);
        setLoading(false);
      });
  }, []);

  const flatList = flattenCategories(categories);

  const filtered = flatList.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cat) => {
    const alreadySelected = selectedCategory.some((c) => c._id === cat._id);
    if (alreadySelected) {
      notifySuccess("This category is already selected!");
      setIsOpen(false);
      return;
    }

    const newSelected = [...selectedCategory, { _id: cat._id, name: cat.name }];
    setSelectedCategory(newSelected);
    setDefaultCategory([{ _id: cat._id, name: cat.name }]);
    setIsOpen(false);
    setSearch("");
  };

  const handleRemove = (id) => {
    const updated = selectedCategory.filter((c) => c._id !== id);
    setSelectedCategory(updated);
    if (updated.length > 0) {
      setDefaultCategory([updated[updated.length - 1]]);
    } else {
      setDefaultCategory([]);
    }
  };

  return (
    <div className="relative w-full">
      {/* Selected category tags */}
      {selectedCategory.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCategory.map((cat) => (
            <span
              key={cat._id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat._id)}
                className="hover:text-red-600 transition-colors ml-1"
              >
                <FiX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 bg-gray-100 rounded-md hover:border-green-400 focus:outline-none focus:border-green-500 transition-colors"
      >
        <span className="text-gray-500">
          {loading ? "Loading categories…" : "Select Category"}
        </span>
        <FiChevronDown
          className={`transition-transform duration-200 text-gray-400 ${isOpen ? "rotate-180" : ""}`}
          size={16}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col">
          {/* Search box */}
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full text-sm outline-none bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:border-green-400"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">
                No categories found
              </p>
            ) : (
              filtered.map((cat) => {
                const isSelected = selectedCategory.some(
                  (c) => c._id === cat._id
                );
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-green-50 text-green-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    style={{ paddingLeft: `${12 + cat.level * 20}px` }}
                  >
                    {cat.level > 0 && (
                      <span className="text-gray-300 mr-1">
                        {"└".repeat(1)}
                      </span>
                    )}
                    {cat.name}
                    {isSelected && (
                      <span className="float-right text-green-500 text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearch("");
          }}
        />
      )}
    </div>
  );
};

export default ParentCategory;
