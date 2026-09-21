import React from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "@layout/Layout";
import useFilter from "@hooks/useFilter";
import ProductServices from "@services/ProductServices";
import BrandServices from "@services/BrandServices";
import ProductEnquiryModal from "@components/modal/ProductEnquiryModal";
import AttributeServices from "@services/AttributeServices";
import CategoryRelatedProducts from "@components/category/CategoryRelatedProducts";
import { sanitizeData } from "@utils/dataSanitizer";

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "Newest", label: "Newest" },
  { value: "Low", label: "Price: Low to High" },
  { value: "High", label: "Price: High to Low" },
];

const BrandPage = ({ products, brand, attributes }) => {
  const [visibleProduct, setVisibleProduct] = React.useState(12);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { productData, setSortedField, sortedField } = useFilter(products);

  React.useEffect(() => {
    setVisibleProduct(12);
  }, [sortedField, brand?._id]);

  const brandName = brand?.name || "Brand";

  return (
    <Layout title={brandName} description={`Shop ${brandName} products at Elecmoon`}>
      <div className="bg-gray-50/50 min-h-screen">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-10 py-6 lg:py-8">
          <div className="mb-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Shop by Brand
            </p>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0b1d3d]">
              {brandName}
            </h1>
            {brand?.description ? (
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                {brand.description}
              </p>
            ) : null}
            <Link
              href="/search"
              className="inline-block mt-3 text-xs font-bold text-[#ED1C24] uppercase tracking-wider"
            >
              ← Browse all products
            </Link>
          </div>

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
                No products for this brand yet
              </h2>
            </div>
          ) : (
            <CategoryRelatedProducts
              products={productData}
              attributes={attributes}
              categoryTitle={brandName}
              sortedField={sortedField}
              onSortChange={setSortedField}
              visibleCount={visibleProduct}
              onLoadMore={() => setVisibleProduct((n) => n + 8)}
              onEnquire={(product) => {
                setSelectedProduct(product);
                setModalOpen(true);
              }}
              sortOptions={SORT_OPTIONS}
              totalLabel="Total Products"
              loadMoreLabel="Load More"
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

export default BrandPage;

export const getServerSideProps = async (context) => {
  const slug = String(context.params?.slug || "").toLowerCase();
  if (!slug) return { notFound: true };

  try {
    const brand = await BrandServices.getBrandBySlug(slug);
    if (!brand?._id) return { notFound: true };

    const [data, attributes] = await Promise.all([
      ProductServices.getShowingStoreProducts({
        brand: brand._id,
        page: "1",
        limit: "60",
      }),
      AttributeServices.getShowingAttributes({}),
    ]);

    return {
      props: {
        brand: sanitizeData(brand),
        products: sanitizeData(data?.products) || [],
        attributes: sanitizeData(attributes) || [],
      },
    };
  } catch (error) {
    // Missing brand API / brand slug → clean 404, no noisy stack in UX
    return { notFound: true };
  }
};
