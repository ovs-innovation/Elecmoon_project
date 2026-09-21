import ReactTagInput from "@pathofdev/react-tag-input";
import {
  Button,
  Input,
  TableCell,
  TableContainer,
  TableHeader,
  Textarea,
  Table,
} from "@windmill/react-ui";
import Multiselect from "multiselect-react-dropdown";
import React, { useEffect, useState } from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { MultiSelect } from "react-multi-select-component";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import ServiceServices from "@/services/ServiceServices";

//internal import

import Title from "@/components/form/others/Title";
import Error from "@/components/form/others/Error";
import InputArea from "@/components/form/input/InputArea";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import LabelArea from "@/components/form/selectOption/LabelArea";
import DrawerButton from "@/components/form/button/DrawerButton";
import { notifySuccess } from "@/utils/toast";
import InputValue from "@/components/form/input/InputValue";
import useProductSubmit from "@/hooks/useProductSubmit";
import ActiveButton from "@/components/form/button/ActiveButton";
import InputValueFive from "@/components/form/input/InputValueFive";
import Uploader from "@/components/image-uploader/Uploader";
import ParentCategory from "@/components/category/ParentCategory";
import BrandServices from "@/services/BrandServices";
import UploaderThree from "@/components/image-uploader/UploaderThree";
import AttributeOptionTwo from "@/components/attribute/AttributeOptionTwo";
import AttributeListTable from "@/components/attribute/AttributeListTable";
import SwitchToggleForCombination from "@/components/form/switch/SwitchToggleForCombination";
import QuantityTiersEditor from "@/components/product/QuantityTiersEditor";
import DatasheetUploader from "@/components/product/DatasheetUploader";

const ProductDrawer = ({ id }) => {
  const { t } = useTranslation();

  // Service selection state — MUST be declared before useProductSubmit
  const [allServices, setAllServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  const {
    tag,
    setTag,
    values,
    language,
    register,
    onSubmit,
    errors,
    slug,
    openModal,
    attribue,
    setValues,
    variants,
    imageUrl,
    setImageUrl,
    handleSubmit,
    isCombination,
    variantTitle,
    attributes,
    attTitle,
    handleAddAtt,
    productId,
    onCloseModal,
    isBulkUpdate,
    isSubmitting,
    tapValue,
    setTapValue,
    resetRefTwo,
    handleSkuBarcode,
    handleProductTap,
    selectedCategory,
    setSelectedCategory,
    setDefaultCategory,
    defaultCategory,
    selectedBrand,
    setSelectedBrand,
    handleProductSlug,
    handleSelectLanguage,
    handleIsCombination,
    setValue,
    watch,
    handleRemoveVariant,
    handleClearVariant,
    handleQuantityPrice,
    handleSelectImage,
    handleSelectInlineImage,
    handleGenerateCombination,
    handleUpdateVariant,
    quantityTiers,
    setQuantityTiers,
    datasheetUrl,
    setDatasheetUrl,
  } = useProductSubmit(id, selectedServices);

  const { showingTranslateValue } = useUtilsFunction();

  // Load all services on mount
  useEffect(() => {
    ServiceServices.getAllServices()
      .then((data) => setAllServices(Array.isArray(data) ? data : []))
      .catch(() => setAllServices([]));
  }, []);

  useEffect(() => {
    BrandServices.getAllBrands()
      .then((data) => setBrandOptions(Array.isArray(data) ? data : []))
      .catch(() => setBrandOptions([]));
  }, []);

  // When editing a product, pre-populate selected services
  useEffect(() => {
    if (id && allServices.length > 0) {
      import("@/services/ProductServices").then(({ default: PS }) => {
        PS.getProductById(id).then((res) => {
          if (res && res.services && Array.isArray(res.services)) {
            const serviceIds = res.services.map((s) =>
              typeof s === "object" ? s._id : s
            );
            setSelectedServices(serviceIds);
          }
        }).catch(() => {});
      });
    } else if (!id) {
      setSelectedServices([]);
    }
  }, [id, allServices]);

  return (
    <>
      <Modal
        open={openModal}
        onClose={onCloseModal}
        center
        closeIcon={
          <div className="absolute top-0 right-0 text-red-500  active:outline-none text-xl border-0">
            <FiX className="text-3xl" />
          </div>
        }
      >
        <div className="cursor-pointer">
          <UploaderThree
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            handleSelectImage={handleSelectImage}
          />
        </div>
      </Modal>

      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {id ? (
          <Title
            register={register}
            handleSelectLanguage={handleSelectLanguage}
            title={t("UpdateProduct")}
            description={t("UpdateProductDescription")}
          />
        ) : (
          <Title
            register={register}
            handleSelectLanguage={handleSelectLanguage}
            title={t("DrawerAddProduct")}
            description={t("AddProductDescription")}
          />
        )}
      </div>

      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-700">
        <SwitchToggleForCombination
          product
          handleProcess={handleIsCombination}
          processOption={isCombination}
        />

        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <ActiveButton
              tapValue={tapValue}
              activeValue="Basic Info"
              handleProductTap={handleProductTap}
            />
          </li>

          {isCombination && (
            <li className="mr-2">
              <ActiveButton
                tapValue={tapValue}
                activeValue="Combination"
                handleProductTap={handleProductTap}
              />
            </li>
          )}
        </ul>
      </div>

      <Scrollbars className="track-horizontal thumb-horizontal w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="block" id="block">
          {tapValue === "Basic Info" && (
            <div className="px-6 pt-8 flex-grow w-full h-full max-h-full pb-40 md:pb-32 lg:pb-32 xl:pb-32">
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductID")} />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    {...register("productId", {
                      required: "Product ID is required!",
                    })}
                    name="productId"
                    type="text"
                    placeholder={t("ProductID")}
                    defaultValue={productId}
                  />
                  <Error errorName={errors.productId} />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductTitleName")} />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    {...register(`title`, {
                      required: "TItle is required!",
                    })}
                    name="title"
                    type="text"
                    placeholder={t("ProductTitleName")}
                    onBlur={(e) => handleProductSlug(e.target.value)}
                  />
                  <Error errorName={errors.title} />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductDescription")} />
                <div className="col-span-8 sm:col-span-4">
                  <Textarea
                    className="border text-sm  block w-full bg-gray-100 border-gray-200"
                    {...register("description", {
                      required: false,
                    })}
                    name="description"
                    placeholder={t("ProductDescription")}
                    rows="4"
                    spellCheck="false"
                  />
                  <Error errorName={errors.description} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Product Highlights" />
                <div className="col-span-8 sm:col-span-4">
                  <Textarea
                    className="border text-sm  block w-full bg-gray-100 border-gray-200"
                    {...register("highlights", {
                      required: false,
                    })}
                    name="highlights"
                    placeholder="Enter product highlights (one point per line)"
                    rows="4"
                    spellCheck="false"
                  />
                  <Error errorName={errors.highlights} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Product Video (YT Link)" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Product Video URL"
                    name="videoUrl"
                    type="text"
                    placeholder="Enter YouTube Video URL"
                  />
                  <Error errorName={errors.videoUrl} />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductImage")} />
                <div className="col-span-8 sm:col-span-4">
                  <Uploader
                    product
                    folder="product"
                    imageUrl={imageUrl}
                    setImageUrl={setImageUrl}
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductSKU")} />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label={t("ProductSKU")}
                    name="sku"
                    type="text"
                    placeholder={t("ProductSKU")}
                  />
                  <Error errorName={errors.sku} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Base Price (GST Excl.)" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Base Price"
                    name="basePrice"
                    type="number"
                    placeholder="Enter price without GST"
                  />
                  <Error errorName={errors.basePrice} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="GST Percentage" />
                <div className="col-span-8 sm:col-span-4">
                  <select
                    {...register("gstPercentage")}
                    className="border text-sm block w-full bg-gray-100 border-gray-200 rounded-md p-2"
                    name="gstPercentage"
                  >
                    <option value="0">0% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                  <Error errorName={errors.gstPercentage} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Final Price (GST Incl.)" />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    type="number"
                    className="border text-sm block w-full bg-gray-200 border-gray-200"
                    readOnly
                    value={(Number(watch("basePrice") || 0) * (1 + Number(watch("gstPercentage") || 0) / 100)).toFixed(2)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Sale price after discount (auto-calculated from base + GST).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Price Before Discount (MRP)" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Price Before Discount"
                    name="originalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 222 (GST inclusive, shown struck-through)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Optional. Must be higher than final price. Shown as crossed-out MRP on the store.
                  </p>
                  <Error errorName={errors.originalPrice} />
                </div>
              </div>


              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Min Order Quantity (MOQ)" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Min Order Quantity"
                    name="minOrderQuantity"
                    type="number"
                    min="1"
                    placeholder="Minimum units per order"
                  />
                  <Error errorName={errors.minOrderQuantity} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Max Order Quantity" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Max Order Quantity"
                    name="maxOrderQuantity"
                    type="number"
                    min="0"
                    placeholder="0 = no limit"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Optional cap per order. Leave 0 for unlimited quantity.
                  </p>
                  <Error errorName={errors.maxOrderQuantity} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Quantity discount slabs" />
                <div className="col-span-8 sm:col-span-4">
                  <QuantityTiersEditor
                    tiers={quantityTiers}
                    onChange={setQuantityTiers}
                    basePrice={
                      Number(watch("basePrice") || 0) *
                      (1 + Number(watch("gstPercentage") || 0) / 100)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Delivery Charge" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Delivery Charge"
                    name="deliveryCharge"
                    type="number"
                    placeholder="Delivery Charge"
                  />
                  <Error errorName={errors.deliveryCharge} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="HSN Code" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="HSN Code"
                    name="hsnCode"
                    type="text"
                    placeholder="e.g. 85076000 (optional, GST format)"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Optional. 2–8 alphanumeric characters as per GST HSN/SAC format.
                  </p>
                  <Error errorName={errors.hsnCode} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Track Inventory" />
                <div className="col-span-8 sm:col-span-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("trackInventory")}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      Enable stock tracking for this product
                    </span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    When disabled, product stays purchasable regardless of stock count (recommended for legacy listings).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Stock Quantity" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="Available inventory units"
                  />
                  <Error errorName={errors.stock} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Low Stock Threshold" />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label="Low Stock Threshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    placeholder="Alert when stock falls to this level"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Default 5. Products at or below this level show as Low Stock.
                  </p>
                  <Error errorName={errors.lowStockThreshold} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Product Datasheet (PDF)" />
                <div className="col-span-8 sm:col-span-4">
                  <DatasheetUploader
                    datasheetUrl={datasheetUrl}
                    setDatasheetUrl={setDatasheetUrl}
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductBarcode")} />
                <div className="col-span-8 sm:col-span-4">
                  <InputArea
                    register={register}
                    label={t("ProductBarcode")}
                    name="barcode"
                    type="text"
                    placeholder={t("ProductBarcode")}
                  />
                  <Error errorName={errors.barcode} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("Category")} />
                <div className="col-span-8 sm:col-span-4">
                  <ParentCategory
                    lang={language}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    setDefaultCategory={setDefaultCategory}
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("DefaultCategory")} />
                <div className="col-span-8 sm:col-span-4">
                  <Multiselect
                    displayValue="name"
                    isObject={true}
                    singleSelect={true}
                    ref={resetRefTwo}
                    hidePlaceholder={true}
                    onKeyPressFn={function noRefCheck() {}}
                    onRemove={function noRefCheck() {}}
                    onSearch={function noRefCheck() {}}
                    onSelect={(v) => setDefaultCategory(v)}
                    selectedValues={defaultCategory}
                    options={selectedCategory}
                    placeholder={"Default Category"}
                  ></Multiselect>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Brand" />
                <div className="col-span-8 sm:col-span-4">
                  <select
                    value={selectedBrand || ""}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full h-12 border border-gray-200 rounded-md px-3 text-sm dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">No brand</option>
                    {brandOptions.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductSlug")} />
                <div className="col-span-8 sm:col-span-4">
                  <Input
                    {...register(`slug`, {
                      required: "slug is required!",
                    })}
                    className=" mr-2 p-2"
                    name="slug"
                    type="text"
                    defaultValue={slug}
                    placeholder={t("ProductSlug")}
                    onBlur={(e) => handleProductSlug(e.target.value)}
                  />
                  <Error errorName={errors.slug} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductTag")} />
                <div className="col-span-8 sm:col-span-4">
                  <ReactTagInput
                    placeholder={t("ProductTagPlaseholder")}
                    tags={tag}
                    onChange={(newTags) => setTag(newTags)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ProductStatus")} />
                <div className="col-span-8 sm:col-span-4">
                  <select
                    {...register("status", {
                      required: "Status is required!",
                    })}
                    className="border text-sm block w-full bg-gray-100 border-gray-200 rounded-md p-2"
                    name="status"
                    defaultValue={values?.status || "show"}
                  >
                    <option value="show">{t("Published")}</option>
                    <option value="hide">{t("Unpublished")}</option>
                  </select>
                  <Error errorName={errors.status} />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Product Type" />
                <div className="col-span-8 sm:col-span-4">
                  <select
                    {...register("type")}
                    className="border text-sm block w-full bg-gray-100 border-gray-200 rounded-md p-2"
                    name="type"
                    defaultValue={values?.type || "normal"}
                  >
                    <option value="normal">Normal</option>
                    <option value="popular">⭐ Popular</option>
                    <option value="trending">🔥 Trending</option>
                    <option value="new">🆕 New Arrival</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Select to feature this product on the homepage.</p>
                </div>
              </div>

              {/* ── Service Selector ── */}
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Link to Services" />
                <div className="col-span-8 sm:col-span-4">
                  {allServices.length > 0 ? (
                    <div className="border border-gray-200 bg-gray-50 rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                      {allServices.map((service) => {
                        const svcName =
                          typeof service.name === "object"
                            ? service.name.en || Object.values(service.name)[0]
                            : service.name;
                        const isChecked = selectedServices.includes(service._id);
                        return (
                          <label
                            key={service._id}
                            className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedServices((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== service._id)
                                    : [...prev, service._id]
                                );
                              }}
                              className="w-4 h-4 accent-green-600"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {svcName || "Unknown Service"}
                            </span>
                            {service.group && (
                              <span className="text-xs text-gray-400 ml-auto">
                                {service.group}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No services found. Add services first.</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Select the services this product belongs to. It will appear on those service pages.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tapValue === "Combination" &&
            isCombination &&
            (attribue.length < 1 ? (
              <div
                className="bg-teal-100 border border-teal-600 rounded-md text-teal-900 px-4 py-3 m-4"
                role="alert"
              >
                <div className="flex">
                  <div className="py-1">
                    <svg
                      className="fill-current h-6 w-6 text-teal-500 mr-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm">
                      {t("AddCombinationsDiscription")}{" "}
                      <Link to="/attributes" className="font-bold">
                        {t("AttributesFeatures")}
                      </Link>
                      {t("AddCombinationsDiscriptionTwo")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3 md:gap-3 xl:gap-3 lg:gap-2 mb-3">
                  <MultiSelect
                    options={attTitle}
                    value={attributes}
                    onChange={(v) => handleAddAtt(v)}
                    labelledBy="Select"
                  />

                  {attributes?.map((attribute, i) => (
                    <div key={attribute._id}>
                      <div className="flex w-full h-10 justify-between font-sans rounded-tl rounded-tr bg-gray-200 px-4 py-3 text-left text-sm font-normal text-gray-700 hover:bg-gray-200">
                        {"Select"}
                        {showingTranslateValue(attribute?.title)}
                      </div>

                      <AttributeOptionTwo
                        id={i + 1}
                        values={values}
                        lang={language}
                        attributes={attribute}
                        setValues={setValues}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mb-6">
                  {attributes?.length > 0 && (
                    <Button
                      onClick={handleGenerateCombination}
                      type="button"
                      className="mx-2"
                    >
                      <span className="text-xs">{t("GenerateVariants")}</span>
                    </Button>
                  )}

                  {variantTitle.length > 0 && (
                    <Button onClick={handleClearVariant} className="mx-2">
                      <span className="text-xs">{t("ClearVariants")}</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}

          {isCombination ? (
            <DrawerButton
              id={id}
              save
              title="Product"
              isSubmitting={isSubmitting}
              handleProductTap={handleProductTap}
            />
          ) : (
            <DrawerButton id={id} title="Product" isSubmitting={isSubmitting} />
          )}

          {tapValue === "Combination" && (
            <DrawerButton id={id} title="Product" isSubmitting={isSubmitting} />
          )}
        </form>

        {tapValue === "Combination" &&
          isCombination &&
          (variantTitle.length > 0 || variants.length > 0) && (
            <div className="px-6 overflow-x-auto">
              {isCombination && (
                <TableContainer className="md:mb-32 mb-40 rounded-b-lg">
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableCell>{t("Images")}</TableCell>
                        <TableCell>{t("VariantDetails")}</TableCell>
                        {/* <TableCell>{t("Sku")}</TableCell> */}
                        <TableCell className="text-right">
                          {t("Actions")}
                        </TableCell>
                      </tr>
                    </TableHeader>

                    <AttributeListTable
                      lang={language}
                      variants={variants}
                      setTapValue={setTapValue}
                      variantTitle={variantTitle}
                      isBulkUpdate={isBulkUpdate}
                      handleSkuBarcode={handleSkuBarcode}
                      handleRemoveVariant={handleRemoveVariant}
                      handleQuantityPrice={handleQuantityPrice}
                      handleSelectInlineImage={handleSelectInlineImage}
                      handleUpdateVariant={handleUpdateVariant}
                      language={language}
                      errors={errors}
                    />
                  </Table>
                </TableContainer>
              )}
            </div>
          )}
      </Scrollbars>
    </>
  );
};

export default React.memo(ProductDrawer);
