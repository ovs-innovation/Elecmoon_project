import { useTranslation } from "react-i18next";

//internal import
import Label from "@/components/form/label/Label";
import Error from "@/components/form/others/Error";
import PageTitle from "@/components/Typography/PageTitle";
import InputAreaTwo from "@/components/form/input/InputAreaTwo";
import SwitchToggle from "@/components/form/switch/SwitchToggle";
import useStoreSettingSubmit from "@/hooks/useStoreSettingSubmit";
import AnimatedContent from "@/components/common/AnimatedContent";
import SettingContainer from "@/components/settings/SettingContainer";

const StoreSetting = () => {
  const { t } = useTranslation();
  const {
    isSave,
    errors,
    register,
    onSubmit,
    handleSubmit,
    isSubmitting,
    enabledCOD,
    setEnabledCOD,
  } = useStoreSettingSubmit();

  return (
    <>
      <PageTitle>{t("StoreSetting")}</PageTitle>
      <AnimatedContent>
        <div className="sm:container w-full md:p-6 p-4 mx-auto bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <SettingContainer
              isSave={isSave}
              title={t("StoreDetails")}
              isSubmitting={isSubmitting}
            >
              <div className="flex-grow scrollbar-hide w-full max-h-full">
                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {t("EnableCOD")} <br />
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                      (Shows on website checkout when Yes)
                    </span>
                  </label>
                  <div className="sm:col-span-4">
                    <SwitchToggle
                      id="cod"
                      processOption={enabledCOD}
                      handleProcess={setEnabledCOD}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <Label label="PhonePe Payment" />
                  <div className="sm:col-span-4">
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Active — configured on server (.env). No Stripe/Razorpay needed.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    API Base URL
                    <br />
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                      (next_api_base_url)
                    </span>
                  </label>
                  <div className="sm:col-span-4">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label="API Base URL"
                      name="next_api_base_url"
                      type="text"
                      placeholder="https://api.elecmoon.com/api"
                    />
                    <Error errorName={errors.next_api_base_url} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Meta / Website URL
                    <br />
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400">
                      (meta_url)
                    </span>
                  </label>
                  <div className="sm:col-span-4">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label="Meta URL"
                      name="meta_url"
                      type="text"
                      placeholder="https://elecmoon.com/"
                    />
                    <Error errorName={errors.meta_url} />
                  </div>
                </div>

                <div className="grid md:grid-cols-5 items-center sm:grid-cols-12 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Website URL
                  </label>
                  <div className="sm:col-span-4">
                    <InputAreaTwo
                      required={true}
                      register={register}
                      label="Website URL"
                      name="website_url"
                      type="text"
                      placeholder="https://elecmoon.com/"
                    />
                    <Error errorName={errors.website_url} />
                  </div>
                </div>
              </div>
            </SettingContainer>
          </form>
        </div>
      </AnimatedContent>
    </>
  );
};

export default StoreSetting;
