import { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiPackage } from "react-icons/fi";
import CategoryImage from "@components/common/CategoryImage";
import ProductServices from "@services/ProductServices";
import { buildCategoryPreviewImages } from "@utils/categoryDisplayImage";

/** Load categoryId -> product image map for card previews */
export const useCategoryPreviewImages = (previewImagesProp = null) => {
  const [loadedPreviews, setLoadedPreviews] = useState({});

  useEffect(() => {
    if (previewImagesProp) return;

    let cancelled = false;

    ProductServices.getShowingStoreProducts({ page: "1", limit: "120" })
      .then((data) => {
        if (cancelled) return;
        setLoadedPreviews(buildCategoryPreviewImages(data?.products || []));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [previewImagesProp]);

  return previewImagesProp || loadedPreviews;
};

export default useCategoryPreviewImages;
