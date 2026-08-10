import { useTranslation } from "react-i18next";

import SwitchToggle from "@/components/form/switch/SwitchToggle";

const StoreSetting = ({ enabledCOD, setEnabledCOD }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-12 font-sans">
      <div className="col-span-12 md:col-span-12 lg:col-span-12 mr-3 ">
        <div className="lg:px-6 pt-4 lg:pl-40 lg:pr-40 md:pl-5 md:pr-5 flex-grow scrollbar-hide w-full max-h-full pb-0">
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
            <label className="block md:text-sm md:col-span-1 sm:col-span-2 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              PhonePe Payment
            </label>
            <div className="sm:col-span-4">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Active — configured on server (.env). No Stripe needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSetting;
