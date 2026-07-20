import React, { useMemo } from "react";
import Image from "next/image";
import useTranslation from "next-translate/useTranslation";

import Layout from "@layout/Layout";
import useFilter from "@hooks/useFilter";
import ProductServices from "@services/ProductServices";
import ProductEnquiryModal from "@components/modal/ProductEnquiryModal";
import AttributeServices from "@services/AttributeServices";
import CategoryCarousel from "@components/carousel/CategoryCarousel";
import CategoryPageHeader from "@components/category/CategoryPageHeader";
import CategoryRelatedProducts from "@components/category/CategoryRelatedProducts";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { sanitizeData } from "@utils/dataSanitizer";
import {
  buildCategoryPreviewImages,
  getFeaturedProductImage,
} from "@utils/categoryDisplayImage";

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "Newest", label: "Newest" },
  { value: "Featured", label: "Featured" },
  { value: "Low", label: "Price: Low to High" },
  { value: "High", label: "Price: High to Low" },
];

const CategoryPage = ({
  products,
  attributes,
  category,
  slug,
  categoryPreviewImages,
  featuredImage,
}) => {
  const { t } = useTranslation();
  const { showingTranslateValue } = useUtilsFunction();
  const [visibleProduct, setVisibleProduct] = React.useState(12);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const categoryTitle = useMemo(() => {
    if (category?.name) return showingTranslateValue(category.name);
    if (slug) {
      return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return "All Products";
  }, [category, slug, showingTranslateValue]);

  const { productData, setSortedField, sortedField } = useFilter(products);

  React.useEffect(() => {
    setVisibleProduct(12);
  }, [sortedField, slug]);

  const handleEnquire = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <Layout
      title={categoryTitle}
      description={`Browse ${categoryTitle} products at Elecmoon`}
    >
      <div className="bg-gray-50/50 min-h-screen">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-10 py-6 lg:py-8">
          <CategoryCarousel
            activeSlug={slug}
            previewImages={categoryPreviewImages}
            showHeader
          />

          <CategoryPageHeader
            category={category}
            categoryTitle={categoryTitle}
            productCount={productData?.length || 0}
            previewImages={categoryPreviewImages}
            featuredImage={featuredImage}
          />

          {productData?.length === 0 ? (
            <div className="mx-auto p-8 my-8 bg-white rounded-2xl border border-gray-100 text-center max-w-lg">
              <Image
                className="my-4 mx-auto"
                src="/no-result.svg"
                alt="no-result"
                width={280}
                height={260}
              />
              <h2 className="text-lg font-bold text-gray-800 mt-2">
                No products in this category yet
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {t("common:sorryText")}
              </p>
            </div>
          ) : (
            <CategoryRelatedProducts
              products={productData}
              attributes={attributes}
              categoryTitle={categoryTitle}
              sortedField={sortedField}
              onSortChange={setSortedField}
              visibleCount={visibleProduct}
              onLoadMore={() => setVisibleProduct((n) => n + 8)}
              onEnquire={handleEnquire}
              sortOptions={SORT_OPTIONS}
              totalLabel={t("common:totalI")}
              loadMoreLabel={t("common:loadMoreBtn")}
            />
          )}
        </div>
      </div>

      <ProductEnquiryModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        product={selectedProduct}
        selectedVariant={selectedProduct?.variants?.[0]}
      />
    </Layout>
  );
};

export default CategoryPage;

export const getServerSideProps = async (context) => {
  const slug = String(context.params?.slug || "").toLowerCase();

  if (!slug) {
    return { notFound: true };
  }

  try {
    const CategoryServices = (await import("@services/CategoryServices")).default;
    const category = await CategoryServices.getCategoryBySlug(slug);

    if (!category?._id) {
      return { notFound: true };
    }

    const [data, attributes, catalog] = await Promise.all([
      ProductServices.getShowingStoreProducts({
        category: category._id,
        page: "1",
        limit: "60",
      }),
      AttributeServices.getShowingAttributes({}),
      ProductServices.getShowingStoreProducts({
        page: "1",
        limit: "120",
      }),
    ]);

    const products = sanitizeData(data?.products) || [];
    const catalogProducts = sanitizeData(catalog?.products) || [];
    const categoryPreviewImages = buildCategoryPreviewImages(catalogProducts);
    const featuredImage = getFeaturedProductImage(products);

    return {
      props: {
        category: sanitizeData(category),
        slug,
        attributes: sanitizeData(attributes) || [],
        products,
        categoryPreviewImages,
        featuredImage: featuredImage || null,
      },
    };
  } catch (error) {
    console.error("Category page error:", error);
    return { notFound: true };
  }
};
