import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { SidebarContext } from "@/context/SidebarContext";
import BrandServices from "@/services/BrandServices";
import { notifyError, notifySuccess } from "@/utils/toast";
import { useImageUploadContext } from "@/context/ImageUploadContext";

const useBrandSubmit = (id) => {
  const { isDrawerOpen, closeDrawer, setIsUpdate } = useContext(SidebarContext);
  const { isUploading } = useImageUploadContext();
  const [status, setStatus] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (!isDrawerOpen) {
      setValue("name", "");
      setValue("slug", "");
      setValue("description", "");
      setImageUrl("");
      setStatus(true);
      clearErrors("name");
      return;
    }

    if (!id) {
      setValue("name", "");
      setValue("slug", "");
      setValue("description", "");
      setImageUrl("");
      setStatus(true);
      return;
    }

    (async () => {
      try {
        const res = await BrandServices.getBrandById(id);
        setValue("name", res.name || "");
        setValue("slug", res.slug || "");
        setValue("description", res.description || "");
        setImageUrl(res.logo || "");
        setStatus(res.status === "show");
      } catch (err) {
        notifyError(err?.response?.data?.message || err.message);
      }
    })();
  }, [id, setValue, isDrawerOpen, clearErrors]);

  const onSubmit = async (data) => {
    try {
      if (isUploading) {
        notifyError("Please wait for image uploads to finish.");
        return;
      }

      setIsSubmitting(true);
      const payload = {
        name: data.name,
        slug: data.slug,
        logo: imageUrl || "",
        description: data.description,
        status: status ? "show" : "hide",
      };
      if (id) {
        const res = await BrandServices.updateBrand(id, payload);
        notifySuccess(res.message);
      } else {
        const res = await BrandServices.addBrand(payload);
        notifySuccess(res.message);
      }
      setIsUpdate(true);
      setIsSubmitting(false);
      closeDrawer();
      reset();
      setImageUrl("");
    } catch (err) {
      setIsSubmitting(false);
      notifyError(err?.response?.data?.message || err.message);
    }
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    status,
    setStatus,
    imageUrl,
    setImageUrl,
    isSubmitting,
  };
};

export default useBrandSubmit;
