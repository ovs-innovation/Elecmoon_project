const WRAPPER_NAMES = new Set([
  "home",
  "all categories",
  "all departments",
]);

const getName = (name) => {
  if (!name) return "";
  if (typeof name === "string") return name;
  return name.en || Object.values(name).find(Boolean) || "";
};

/** Same root list logic as storefront — never use data[0].children blindly */
export const getAdminRootCategories = (tree) => {
  if (!Array.isArray(tree) || tree.length === 0) return [];

  if (tree.length === 1) {
    const label = getName(tree[0].name).toLowerCase().trim();
    const children = tree[0].children || [];
    if (WRAPPER_NAMES.has(label) && children.length > 0) {
      return children;
    }
    if (!tree[0].parentId && children.length > 0 && WRAPPER_NAMES.has(label)) {
      return children;
    }
  }

  return tree.filter((cat) => {
    const label = getName(cat.name).toLowerCase().trim();
    return label && !WRAPPER_NAMES.has(label);
  });
};

/** Flat list for "All" view in admin */
export const flattenCategoryTree = (tree, depth = 0, parentLabel = "") => {
  if (!Array.isArray(tree)) return [];

  return tree.flatMap((cat) => {
    const name = getName(cat.name);
    const row = {
      ...cat,
      _depth: depth,
      _parentLabel: parentLabel,
      children: cat.children || [],
    };
    const childRows = flattenCategoryTree(cat.children || [], depth + 1, name);
    return [row, ...childRows];
  });
};

export const normalizeFlatCategories = (flatList) => {
  if (!Array.isArray(flatList)) return [];
  return flatList.map((cat) => ({
    ...cat,
    children: [],
    _depth: 0,
    _parentLabel: cat.parentName || "",
  }));
};
