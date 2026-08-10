import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

//internal import
import useDisableForDemo from "./useDisableForDemo";
import { SidebarContext } from "@/context/SidebarContext";
import SettingServices from "@/services/SettingServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const useStoreSettingSubmit = () => {
  const { setIsUpdate } = useContext(SidebarContext);
  const [isSave, setIsSave] = useState(true);
  const [metaImg, setMetaImg] = useState("");
  const [favicon, setFavicon] = useState("");
  const [enabledCOD, setEnabledCOD] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleDisableForDemo } = useDisableForDemo();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (handleDisableForDemo()) {
      return;
    }
    try {
      setIsSubmitting(true);

      // Only patch COD + URLs. Do not touch social login / analytics / tawk /
      // stripe credentials so existing DB values stay intact.
      const settingData = {
        name: "storeSetting",
        setting: {
          cod_status: enabledCOD,
          stripe_status: false,
          razorpay_status: false,
          next_api_base_url:
            data.next_api_base_url || "https://api.elecmoon.com/api",
          meta_url: data.meta_url || "https://elecmoon.com/",
          website_url: data.website_url || "https://elecmoon.com/",
        },
      };

      const res = await SettingServices.updateStoreSetting(settingData);
      setIsUpdate(true);
      setIsSubmitting(false);
      window.location.reload();
      notifySuccess(res.message);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await SettingServices.getStoreSetting();
        if (res) {
          setIsSave(false);
          setEnabledCOD(res.cod_status !== false);
          setValue(
            "next_api_base_url",
            res.next_api_base_url || "https://api.elecmoon.com/api"
          );
          setValue("meta_url", res.meta_url || "https://elecmoon.com/");
          setValue("website_url", res.website_url || "https://elecmoon.com/");
        }
      } catch (err) {
        notifyError(err?.response?.data?.message || err.message);
      }
    })();
  }, []);

  return {
    errors,
    register,
    isSave,
    favicon,
    setFavicon,
    metaImg,
    setMetaImg,
    isSubmitting,
    onSubmit,
    handleSubmit,
    enabledCOD,
    setEnabledCOD,
  };
};

export default useStoreSettingSubmit;
