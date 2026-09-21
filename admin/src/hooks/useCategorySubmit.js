import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";

import { SidebarContext } from "@/context/SidebarContext";
import CategoryServices from "@/services/CategoryServices";
import { notifyError, notifySuccess } from "@/utils/toast";
import { useImageUploadContext } from "@/context/ImageUploadContext";
import useTranslationValue from "./useTranslationValue";

const useCategorySubmit = (id, data) => {
  const { isDrawerOpen, closeDrawer, setIsUpdate, lang } =
    useContext(SidebarContext);
  const location = useLocation();
  const isSubcategoryPage = location.pathname === "/subcategories";

  const [resData, setResData] = useState({});
  const [checked, setChecked] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [children, setChildren] = useState([]);
  const [language, setLanguage] = useState("en");
  const [published, setPublished] = useState(true);
  const [selectCategoryName, setSelectCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handlerTextTranslateHandler } = useTranslationValue();
  const { isUploading } = useImageUploadContext();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ name, description }) => {
    try {
      if (isUploading) {
        notifyError("Please wait for image uploads to finish.");
        return;
      }

      // Categories page = always top-level; Subcategories = always needs parent
      if (isSubcategoryPage && !checked) {
        notifyError("Please select a parent category.");
        return;
      }

      setIsSubmitting(true);
      const nameTranslates = await handlerTextTranslateHandler(
        name,
        language,
        resData?.name
      );
      const descriptionTranslates = await handlerTextTranslateHandler(
        description,
        language,
        resData?.description
      );

      const asParent = !isSubcategoryPage;

      const categoryData = {
        name: {
          ...nameTranslates,
          [language]: name,
        },
        description: {
          ...descriptionTranslates,
          [language]: description ? description : "",
        },
        parentId: asParent ? undefined : checked || undefined,
        parentName: asParent
          ? "Home"
          : selectCategoryName
            ? selectCategoryName
            : "Home",
        icon: imageUrl,
        status: published ? "show" : "hide",
        lang: language,
      };

      if (id) {
        const res = await CategoryServices.updateCategory(id, categoryData);
        setIsUpdate(true);
        setIsSubmitting(false);
        notifySuccess(res.message);
        closeDrawer();
        reset();
      } else {
        const res = await CategoryServices.addCategory(categoryData);
        setIsUpdate(true);
        setIsSubmitting(false);
        notifySuccess(res.message);
        closeDrawer();
      }
    } catch (err) {
      setIsSubmitting(false);
      notifyError(err ? err?.response?.data?.message : err?.message);
      closeDrawer();
    }
  };

  const handleSelectLanguage = (langCode) => {
    setLanguage(langCode);
    if (Object.keys(resData).length > 0) {
      setValue("name", resData.name[langCode ? langCode : "en"]);
      setValue("description", resData.description[langCode ? langCode : "en"]);
    }
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      setResData({});
      setValue("name");
      setValue("parentId");
      setValue("parentName");
      setValue("description");
      setValue("icon");
      setImageUrl("");
      setPublished(true);
      clearErrors("name");
      clearErrors("parentId");
      clearErrors("parentName");
      clearErrors("description");
      setSelectCategoryName("");
      setLanguage(lang);
      setValue("language", language);
      setChecked("");
      return;
    }
    if (id) {
      (async () => {
        try {
          const res = await CategoryServices.getCategoryById(id);
          if (res) {
            setResData(res);
            setValue("name", res.name[language ? language : "en"]);
            setValue(
              "description",
              res.description[language ? language : "en"]
            );
            setValue("language", language);
            setValue("parentId", res.parentId);
            setValue("parentName", res.parentName);
            setSelectCategoryName(res.parentName || "");
            setChecked(res.parentId || "");
            setImageUrl(res.icon);
            setPublished(res.status === "show");
          }
        } catch (err) {
          notifyError(err ? err.response.data.message : err.message);
        }
      })();
    }
  }, [
    id,
    setValue,
    isDrawerOpen,
    language,
    clearErrors,
    data,
    lang,
    isSubcategoryPage,
  ]);

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    imageUrl,
    setImageUrl,
    children,
    setChildren,
    published,
    setPublished,
    checked,
    setChecked,
    isSubmitting,
    selectCategoryName,
    setSelectCategoryName,
    handleSelectLanguage,
  };
};

export default useCategorySubmit;
