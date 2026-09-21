import combinate from "combinate";
import { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import swal from "sweetalert";

//internal import
import useAsync from "@/hooks/useAsync";
import useUtilsFunction from "./useUtilsFunction";
import { SidebarContext } from "@/context/SidebarContext";
import AttributeServices from "@/services/AttributeServices";
import ProductServices from "@/services/ProductServices";
import { notifyError, notifySuccess } from "@/utils/toast";
import { useImageUploadContext } from "@/context/ImageUploadContext";
import useTranslationValue from "./useTranslationValue";

const useProductSubmit = (id, selectedServices = []) => {
  const location = useLocation();
  const { isDrawerOpen, closeDrawer, setIsUpdate, lang } =
    useContext(SidebarContext);

  const { data: attribue } = useAsync(AttributeServices.getShowingAttributes);

  // react ref
  const resetRef = useRef([]);
  const resetRefTwo = useRef("");

  // react hook
  const [imageUrl, setImageUrl] = useState([]);
  const [tag, setTag] = useState([]);
  const [values, setValues] = useState({});
  let [variants, setVariants] = useState([]);
  const [variant, setVariant] = useState([]);
  // const [totalStock, setTotalStock] = useState(0);
  // const [quantity, setQuantity] = useState(0);

  // const [originalPrice, setOriginalPrice] = useState(0);
  // const [price, setPrice] = useState(0);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isBasicComplete, setIsBasicComplete] = useState(false);
  const [tapValue, setTapValue] = useState("Basic Info");
  const [isCombination, setIsCombination] = useState(false);
  const [attTitle, setAttTitle] = useState([]);
  const [variantTitle, setVariantTitle] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [productId, setProductId] = useState("");
  const [updatedId, setUpdatedId] = useState(id);
  const [imgId, setImgId] = useState("");
  const [isBulkUpdate, setIsBulkUpdate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [defaultCategory, setDefaultCategory] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [resData, setResData] = useState({});
  const [language, setLanguage] = useState("en");
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slug, setSlug] = useState("");
  const [highlights, setHighlights] = useState("");
  const [quantityTiers, setQuantityTiers] = useState([]);
  const [datasheetUrl, setDatasheetUrl] = useState("");

  const HSN_PATTERN = /^[0-9A-Za-z]{2,8}$/;

  const sanitizeQuantityTiers = (tiers = []) => {
    if (!Array.isArray(tiers)) return [];
    return tiers
      .map((t) => ({
        minQuantity: Math.max(1, parseInt(t.minQuantity, 10) || 1),
        maxQuantity: Math.max(0, parseInt(t.maxQuantity, 10) || 0),
        discountPercent: Math.min(
          100,
          Math.max(0, Number(t.discountPercent) || 0)
        ),
        unitPrice: Math.max(0, Number(t.unitPrice) || 0),
      }))
      .sort((a, b) => a.minQuantity - b.minQuantity);
  };

  const { handlerTextTranslateHandler } = useTranslationValue();
  const { showingTranslateValue, getNumber, getNumberTwo } = useUtilsFunction();
  const { isUploading } = useImageUploadContext();

  const handleRemoveEmptyKey = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    for (const key in obj) {
      if (obj[key] && typeof obj[key] === "string" && obj[key].trim() === "") {
        delete obj[key];
      }
    }
    // console.log("obj", obj);
    return obj;
  };

  // handle click
  const onCloseModal = () => {
    setOpenModal(false);
    setImgId("");
  };
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm();

  // console.log("res", resData);

  const onSubmit = async (data) => {
    // console.log('data is data',data)
    try {
      if (isUploading) {
        notifyError("Please wait for image uploads to finish.");
        return;
      }

      setIsSubmitting(true);
      if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
        setIsSubmitting(false);
        return notifyError("Image is required!");
      }

      // if (data.originalPrice < data.price) {
      //   setIsSubmitting(false);
      //   return notifyError(
      //     "Sale Price must be less then or equal of product price!"
      //   );
      // }
      if (!defaultCategory[0]) {
        setIsSubmitting(false);
        return notifyError("Default Category is required!");
      }

      const finalPrice =
        getNumber(data.basePrice) +
        (getNumber(data.basePrice) * Number(data.gstPercentage || 0)) / 100;
      const mrp = Number(data.originalPrice) || 0;
      if (mrp > 0 && mrp <= finalPrice) {
        setIsSubmitting(false);
        return notifyError(
          "Price Before Discount (MRP) must be higher than Final Sale Price."
        );
      }

      const hsnRaw = String(data.hsnCode || "").trim();
      if (hsnRaw && !HSN_PATTERN.test(hsnRaw)) {
        setIsSubmitting(false);
        return notifyError(
          "HSN code must be 2–8 alphanumeric characters (GST format)."
        );
      }

      // const updatedVariants = variants.map((v, i) => {
      //   const newObj = {
      //     ...v,
      //     price: getNumberTwo(v?.price),
      //     originalPrice: getNumberTwo(v?.originalPrice),
      //     discount: getNumberTwo(v?.discount),
      //     quantity: Number(v?.quantity || 0),
      //   };
      //   return newObj;
      // });

      setIsBasicComplete(true);
      // setPrice(data.price);
      // setQuantity(data.stock);
      setBarcode(data.barcode);
      setSku(data.sku);
      // setOriginalPrice(data.originalPrice);

      const titleTranslates = await handlerTextTranslateHandler(
        data.title,
        language,
        resData?.title
      );
      const descriptionTranslates = await handlerTextTranslateHandler(
        data.description,
        language,
        resData?.description
      );
      const highlightsTranslates = await handlerTextTranslateHandler(
        data.highlights,
        language,
        resData?.highlights
      );

      const productData = {
        productId: productId || "",
        sku: data.sku || "",
        barcode: data.barcode || "",
        title: {
          ...titleTranslates,
          [language]: data.title,
        },
        description: {
          ...descriptionTranslates,
          [language]: data.description || "",
        },
        highlights: {
          ...highlightsTranslates,
          [language]: data.highlights || "",
        },
        slug: data.slug
          ? data.slug
          : data.title.toLowerCase().replace(/[^A-Z0-9]+/gi, "-"),

        categories:
          selectedCategory && Array.isArray(selectedCategory)
            ? selectedCategory.map((item) => item._id)
            : [],
        category:
          defaultCategory && defaultCategory[0] ? defaultCategory[0]._id : "",
        brand: selectedBrand || null,

        image: imageUrl || [],
        status: data.status || "show",
        productId: data.productId || productId || "",
        // stock: variants?.length < 1 ? data.stock : Number(totalStock),
        tag: JSON.stringify(tag || []),

        // prices: {
        //   price: getNumber(data.price),
        //   originalPrice: getNumberTwo(data.originalPrice),
        //   discount: Number(data.originalPrice) - Number(data.price),
        // },
        isCombination: variants && variants.length > 0 ? isCombination : false,
        variants: isCombination && variants ? variants : [],
        basePrice: getNumber(data.basePrice),
        gstPercentage: Number(data.gstPercentage || 0),
        price: getNumber(data.basePrice) + (getNumber(data.basePrice) * Number(data.gstPercentage || 0)) / 100,
        originalPrice: Number(data.originalPrice) > 0 ? getNumber(data.originalPrice) : 0,
        minOrderQuantity: Number(data.minOrderQuantity || 1),
        maxOrderQuantity: Math.max(0, Number(data.maxOrderQuantity || 0)),
        quantityTiers: sanitizeQuantityTiers(quantityTiers),
        deliveryCharge: Number(data.deliveryCharge || 0),
        type: data.type || "normal",
        services: selectedServices || [],
        videoUrl: data.videoUrl || "",
        hsnCode: hsnRaw,
        stock: Math.max(0, parseInt(data.stock, 10) || 0),
        trackInventory: Boolean(data.trackInventory),
        lowStockThreshold: Math.max(
          0,
          parseInt(data.lowStockThreshold, 10) ?? 5
        ),
        datasheetUrl: datasheetUrl || "",
      };

      // console.log("productData ===========>", productData, "data", data);
      // return setIsSubmitting(false);

      if (updatedId) {
        const res = await ProductServices.updateProduct(updatedId, productData);
        if (res && typeof res === "object") {
          if (isCombination) {
            setIsUpdate(true);
            notifySuccess(res.message);
            setIsBasicComplete(true);
            setIsSubmitting(false);
            handleProductTap("Combination", true);
          } else {
            setIsUpdate(true);
            notifySuccess(res.message);
            setIsSubmitting(false);
          }
        }

        if (
          tapValue === "Combination" ||
          (tapValue !== "Combination" && !isCombination)
        ) {
          closeDrawer();
        }
      } else {
        const res = await ProductServices.addProduct(productData);
        // console.log("res is ", res);
        if (res && typeof res === "object" && isCombination) {
          setUpdatedId(res._id);
          setValue("title", res.title[language ? language : "en"]);
          setValue("description", res.description[language ? language : "en"]);
          setValue("slug", res.slug);
          setValue("status", res.status);
          setValue("barcode", res.barcode);
          setValue("stock", res.stock);
          setTag(JSON.parse(res.tag || "[]"));
          setImageUrl(res.image || []);
          setVariants(res.variants || []);
          setValue("productId", res.productId);
          setProductId(res.productId);
          // setOriginalPrice(res?.prices?.originalPrice);
          // setPrice(res?.prices?.price);
          setBarcode(res.barcode);
          setSku(res.sku);
                      if (res.variants && Array.isArray(res.variants)) {
              const result = res.variants.map(
                ({
                  originalPrice,
                  price,
                  discount,
                  quantity,
                  barcode,
                  sku,
                  productId,
                  image,
                  images,
                  title,
                  description,
                  highlights,
                  slug,
                  ...rest
                }) => rest
              );

              setVariant(result);
            }

          setIsUpdate(true);
          setIsBasicComplete(true);
          setIsSubmitting(false);
          handleProductTap("Combination", true);
          notifySuccess("Product Added Successfully!");
        } else {
          setIsUpdate(true);
          notifySuccess("Product Added Successfully!");
        }

        if (
          tapValue === "Combination" ||
          (tapValue !== "Combination" && !isCombination)
        ) {
          setIsSubmitting(false);
          closeDrawer();
        }
      }
    } catch (err) {
      // console.log("err", err);
      setIsSubmitting(false);
      notifyError(err?.response?.data?.message || err?.message);
      closeDrawer();
    }
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      setSlug("");
      setLanguage(lang);
      setValue("language", language);
      handleProductTap("Basic Info", true);
      setResData({});
      setValue("sku");
      setValue("title");
      setValue("slug");
      setValue("description");
      setValue("highlights");
      // setValue("quantity");
      // setValue("stock");
      setValue("originalPrice");
      setValue("productId");
      setValue("basePrice");
      setValue("price");
      setValue("gstPercentage", 0);
      setValue("minOrderQuantity");
      setValue("maxOrderQuantity", 0);
      setQuantityTiers([]);
      setValue("deliveryCharge", 0);
      setValue("videoUrl", "");
      setValue("hsnCode", "");
      setValue("stock", 0);
      setValue("lowStockThreshold", 5);
      setDatasheetUrl("");

      setProductId("");
      // setValue('status');
      setImageUrl([]);
      setTag([]);
      setVariants([]);
      setVariant([]);
      setValues({});
      // setTotalStock(0);
      setSelectedCategory([]);
      setDefaultCategory([]);
      setHighlights("");
      if (location.pathname === "/products") {
        resetRefTwo?.current?.resetSelectedValues();
      }

      clearErrors("sku");
      clearErrors("title");
      clearErrors("slug");
      clearErrors("description");
      clearErrors("highlights");
      // clearErrors("stock");
      // clearErrors("quantity");
      // setValue("stock", 0);
      // setValue("costPrice", 0);
      // setValue("price", 0);
      // setValue("originalPrice", 0);
      clearErrors("status");
      clearErrors("barcode");
      clearErrors("deliveryCharge");
      setIsCombination(false);
      setIsBasicComplete(false);
      setIsSubmitting(false);
      setAttributes([]);

      setUpdatedId();
      return;
    } else {
      handleProductTap("Basic Info", true);
    }

    if (id) {
      setIsBasicComplete(true);
      (async () => {
        try {
          const res = await ProductServices.getProductById(id);

          // console.log("res", res);

          if (res && typeof res === "object") {
            setResData(res);
            setSlug(res.slug || "");
            setUpdatedId(res._id || "");
            setValue(
              "title",
              res.title && res.title[language ? language : "en"]
                ? res.title[language ? language : "en"]
                : ""
            );
            setValue(
              "description",
              res.description && res.description[language ? language : "en"]
                ? res.description[language ? language : "en"]
                : ""
            );
            setValue(
              "highlights",
              res.highlights && res.highlights[language ? language : "en"]
                ? res.highlights[language ? language : "en"]
                : ""
            );
            setValue("slug", res.slug || "");
            setValue("status", res.status || "show");
            setValue("sku", res.sku || "");
            setValue("barcode", res.barcode || "");
            // setValue("stock", res.stock);
            setValue("productId", res.productId || "");
            setValue("basePrice", res.basePrice || res.price);
            setValue("gstPercentage", res.gstPercentage || 0);
            setValue("price", res.price);
            setValue(
              "originalPrice",
              res.originalPrice || res?.prices?.originalPrice || 0
            );
            setValue("minOrderQuantity", res.minOrderQuantity || 1);
            setValue("maxOrderQuantity", res.maxOrderQuantity || 0);
            setQuantityTiers(
              Array.isArray(res.quantityTiers) ? res.quantityTiers : []
            );
            setValue("deliveryCharge", res.deliveryCharge || 0);
            setValue("type", res.type || "normal");
            setValue("videoUrl", res.videoUrl || "");
            setValue("hsnCode", res.hsnCode || "");
            setValue("stock", res.stock ?? 0);
            setValue("trackInventory", Boolean(res.trackInventory));
            setValue("lowStockThreshold", res.lowStockThreshold ?? 5);
            setDatasheetUrl(res.datasheetUrl || "");
            // setValue("stock", res.stock);
            setProductId(res.productId ? res.productId : res._id);
            setBarcode(res.barcode || "");
            setSku(res.sku || "");
            setHighlights(
              res.highlights && res.highlights[language ? language : "en"]
                ? res.highlights[language ? language : "en"]
                : ""
            );

            if (res.categories && Array.isArray(res.categories)) {
              res.categories.map((category) => {
                if (category && category.name) {
                  category.name = showingTranslateValue(category?.name, lang);
                }
                return category;
              });
            }

            if (res.category && res.category.name) {
              res.category.name = showingTranslateValue(
                res?.category?.name,
                lang
              );
            }

            setSelectedCategory(res.categories || []);
            setDefaultCategory(res?.category ? [res.category] : []);
            setSelectedBrand(
              res?.brand?._id || res?.brand || ""
            );
            setTag(JSON.parse(res.tag || "[]"));
            setImageUrl(res.image || []);
            setVariants(res.variants || []);
            setIsCombination(res.isCombination || false);
            
            // Set variant state for existing product variants
            if (res.variants && Array.isArray(res.variants)) {
              const result = res.variants.map(
                ({
                  originalPrice,
                  price,
                  discount,
                  quantity,
                  barcode,
                  sku,
                  productId,
                  image,
                  images,
                  title,
                  description,
                  highlights,
                  slug,
                  ...rest
                }) => rest
              );
              setVariant(result);
            }
            // setQuantity(res?.stock);
            // setTotalStock(res.stock);
            // setOriginalPrice(res?.prices?.originalPrice);
            // setPrice(res?.prices?.price);
          }
        } catch (err) {
          notifyError(err?.response?.data?.message || err?.message);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    setValue,
    isDrawerOpen,
    location.pathname,
    clearErrors,
    language,
    lang,
  ]);

  //for filter related attribute and extras for every product which need to update
  useEffect(() => {
    if (!attribue) return;

    const result = attribue
      .filter((att) => att && att.option !== "Checkbox")
      .map((v) => {
        return {
          label: showingTranslateValue(v?.title, lang),
          value: showingTranslateValue(v?.title, lang),
        };
      });

    setAttTitle([...result]);

    if (variants && variants.length > 0) {
      // Get all unique keys from variants, excluding the new fields we added
      const allKeys = new Set();
      variants.forEach(variant => {
        Object.keys(variant).forEach(key => {
          // Exclude the new fields we added for variant details
          if (!['title', 'description', 'highlights', 'slug', 'images', 'image', 'sku', 'barcode', 'productId', 'originalPrice', 'discount', 'price', 'quantity'].includes(key)) {
            allKeys.add(key);
          }
        });
      });
      
      const res = Array.from(allKeys);
      const varTitle = attribue.filter((att) => att && res.includes(att._id));
      console.log('Debug - variants:', variants);
      console.log('Debug - allKeys:', res);
      console.log('Debug - attribue:', attribue);
      console.log('Debug - varTitle:', varTitle);
      setVariantTitle(varTitle);
    } else {
      setVariantTitle([]);
    }

    // if (variants?.length > 0) {
    //   const totalStock = variants?.reduce((pre, acc) => pre + acc.quantity, 0);
    //   setTotalStock(Number(totalStock));
    // }
  }, [attribue, variants, language, lang]);

  //for adding attribute values
  const handleAddAtt = (v, el) => {
    if (!v || !Array.isArray(v) || !attribue) return;

    const result = attribue.filter((att) => {
      const attribueTItle = showingTranslateValue(att?.title, lang);
      return v.some((item) => item.label === attribueTItle);
    });

    const attributeArray = result.map((value) => {
      const attributeTitle = showingTranslateValue(value?.title, lang);
      return {
        ...value,
        label: attributeTitle,
        value: attributeTitle,
      };
    });

    setAttributes(attributeArray);
  };

  // Helper function to generate unique slug
  const generateUniqueSlug = (baseSlug, existingSlugs = []) => {
    if (!baseSlug) return "";
    
    let slug = baseSlug;
    let counter = 1;
    
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  };

  // Helper function to generate title from combination attributes
  const generateVariantTitle = (com, productTitle) => {
    if (!com || Object.keys(com).length === 0) return "";
    
    // Get the main product title
    const mainTitle = productTitle || watch("title") || "";
    
    // Get actual attribute names from variantTitle data
    const attributeNames = attribue
      ?.filter(att => com[att._id]) // Only include attributes that are in the combination
      ?.map(att => {
        const attributeData = att?.variants?.filter(val => val?.name !== "All");
        const attributeName = attributeData?.find(v => v._id === com[att._id])?.name;
        return attributeName ? showingTranslateValue(attributeName, language) : com[att._id];
      })
      ?.filter(Boolean);
    
    // Create title from combination attributes
    const combinationText = attributeNames?.join(" ") || Object.values(com).filter(value => value && value.trim()).join(" ");
    
    // Combine main title with combination attributes
    const fullTitle = mainTitle ? `${mainTitle} ${combinationText}`.trim() : combinationText;
    
    return fullTitle;
  };

  // Helper function to generate slug from title
  const generateSlug = (title) => {
    if (!title) return "";
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
  };

  //generate all combination combination
  const handleGenerateCombination = () => {
    if (Object.keys(values).length === 0) {
      return notifyError("Please select a variant first!");
    }

    if (!variants) {
      setVariants([]);
    }

    const result = variants.filter(
      ({
        originalPrice,
        discount,
        price,
        quantity,
        barcode,
        sku,
        productId,
        image,
        images,
        title,
        description,
        highlights,
        slug,
        ...rest
      }) => JSON.stringify({ ...rest }) !== "{}"
    );

    // console.log("result", result);

    setVariants(result);

    const combo = combinate(values);

    combo.map((com, i) => {
      if (JSON.stringify(variant).includes(JSON.stringify(com))) {
        return setVariant((pre) => [...pre, com]);
      } else {
        // Auto-generate title and slug from combination attributes
        const autoGeneratedTitle = generateVariantTitle(com, watch("title"));
        const autoGeneratedSlug = generateSlug(autoGeneratedTitle);
        
        const newCom = {
          ...com,
          title: { [language]: autoGeneratedTitle },
          description: { [language]: "" },
          highlights: { [language]: "" },
          slug: autoGeneratedSlug,
          productId: productId && productId + "-" + (variants.length + i),
          barcode: barcode,
          sku: sku,
          image: imageUrl[0] ? [imageUrl[0]] : [],
        };

        setVariants((pre) => [...pre, newCom]);
        return setVariant((pre) => [...pre, com]);
      }
    });

    setValues({});

    // resetRef?.current?.map((v, i) =>
    //   resetRef?.current[i]?.resetSelectedValues()
    // );
  };

  //for clear selected combination
  const handleClearVariant = () => {
    setVariants([]);
    setVariant([]);
    setValues({});
    if (resetRef?.current) {
      resetRef.current.map(
        async (v, i) => await resetRef.current[i]?.resetSelectedValues()
      );
    }

    // console.log('value', selectedList, removedItem, resetRef.current);
  };

  //for edit combination values








  //for remove combination values
  const handleRemoveVariant = (vari, ext) => {
    if (!vari) return;

    // console.log("handleRemoveVariant", vari, ext);
    swal({
      title: `Are you sure to delete this ${ext ? "Extra" : "combination"}!`,
      text: `(If Okay, It will be delete this ${
        ext ? "Extra" : "combination"
      })`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        const result = variants.filter((v) => v !== vari);
        setVariants(result);
        // console.log("result", result);
        const {
          originalPrice,
          price,
          discount,
          quantity,
          barcode,
          sku,
          productId,
          image,
          images,
          title,
          description,
          highlights,
          slug,
          ...rest
        } = vari;
        const res = variant.filter(
          (obj) => JSON.stringify(obj) !== JSON.stringify(rest)
        );
        setVariant(res);
        setIsBulkUpdate(true);
        // setTimeout(() => setIsBulkUpdate(false), 500);
        const timeOutId = setTimeout(() => setIsBulkUpdate(false), 500);
        return clearTimeout(timeOutId);
      }
    });
  };

  // handle notification for combination and extras
  const handleIsCombination = () => {
    if ((isCombination && variantTitle.length) > 0) {
      swal({
        title: "Are you sure to remove combination from this product!",
        text: "(It will be delete all your combination and extras)",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((value) => {
        // console.log(value);
        if (value) {
          setIsCombination(!isCombination);
          setTapValue("Basic Info");
          setVariants([]);
          setVariant([]);
        }
      });
    } else {
      setIsCombination(!isCombination);
      setTapValue("Basic Info");
    }
  };

  //for select bulk action images
  const handleSelectImage = (img) => {
    if (openModal && variants && variants[imgId]) {
      variants[imgId].image = img;
      setOpenModal(false);
    }
  };

  //for select individual combination image
  const handleSelectInlineImage = (id) => {
    if (id !== undefined && id !== null) {
      setImgId(id);
      setOpenModal(!openModal);
    }
  };

  //this for variant/combination list
  const handleSkuBarcode = (value, name, id) => {
    if (variants && variants[id]) {
      variants[id][name] = value;
    }
  };

  // Handle updating variant details
  const handleUpdateVariant = (updatedVariant, index) => {
    if (variants && variants[index]) {
      const updatedVariants = [...variants];
      updatedVariants[index] = updatedVariant;
      setVariants(updatedVariants);
    }
  };

  const handleProductTap = (e, value, name) => {
    if (!e) return;

    // console.log(e);

    if (value) {
      if (!value)
        return notifyError(
          `${"Please save product before adding combinations!"}`
        );
    } else {
      if (!isBasicComplete)
        return notifyError(
          `${"Please save product before adding combinations!"}`
        );
    }
    setTapValue(e);
  };

  //this one for combination list
  const handleQuantityPrice = (value, name, id, variant) => {
    if (!variant || !variants || id === undefined || id === null) return;

    // console.log(
    //   "handleQuantityPrice",
    //   "name",
    //   name,
    //   "value",
    //   value,
    //   "variant",
    //   variant
    // );
    if (name === "originalPrice" && Number(value) < Number(variant.price)) {
      // variants[id][name] = Number(variant.originalPrice);
      notifyError("Price must be more then or equal of originalPrice!");
      setValue("originalPrice", variant.originalPrice);
      setIsBulkUpdate(true);
      const timeOutId = setTimeout(() => setIsBulkUpdate(false), 100);
      return () => clearTimeout(timeOutId);
    }
    if (name === "price" && Number(variant.originalPrice) < Number(value)) {
      // variants[id][name] = Number(variant.originalPrice);
      notifyError("Sale Price must be less then or equal of product price!");
      setValue("price", variant.originalPrice);
      setIsBulkUpdate(true);
      const timeOutId = setTimeout(() => setIsBulkUpdate(false), 100);
      return () => clearTimeout(timeOutId);
    }
    setVariants((pre) =>
      pre.map((com, i) => {
        if (i === id) {
          const updatedCom = {
            ...com,
            [name]: Math.round(value),
          };

          if (name === "price") {
            updatedCom.price = getNumberTwo(value);
            updatedCom.discount = Number(variant.originalPrice) - Number(value);
          }
          if (name === "originalPrice") {
            updatedCom.originalPrice = getNumberTwo(value);
            updatedCom.discount = Number(value) - Number(variant.price);
          }

          return updatedCom;
        }
        return com;
      })
    );

    // const totalStock = variants.reduce(
    //   (pre, acc) => Number(pre) + Number(acc.quantity),
    //   0
    // );
    // setTotalStock(Number(totalStock));
  };

  //for change language in product drawer
  const handleSelectLanguage = (lang) => {
    if (!lang) return;

    setLanguage(lang);
    if (resData && Object.keys(resData).length > 0) {
      setValue("title", resData.title[lang ? lang : "en"]);
      setValue("description", resData.description[lang ? lang : "en"]);
      setValue(
        "highlights",
        resData.highlights ? resData.highlights[lang ? lang : "en"] : ""
      );
    }
  };

  //for handle product slug
  const handleProductSlug = (value) => {
    if (!value) return;

    setValue("slug", value.toLowerCase().replace(/[^A-Z0-9]+/gi, "-"));
    setSlug(value.toLowerCase().replace(/[^A-Z0-9]+/gi, "-"));
  };

  return {
    tag,
    setTag,
    values,
    language,
    register,
    watch,
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

    handleRemoveVariant,
    handleClearVariant,
    handleQuantityPrice,
    handleSelectImage,
    handleSelectInlineImage,
    handleGenerateCombination,
    handleUpdateVariant,
    highlights,
    setHighlights,
    quantityTiers,
    setQuantityTiers,
    datasheetUrl,
    setDatasheetUrl,
  };
};

export default useProductSubmit;
