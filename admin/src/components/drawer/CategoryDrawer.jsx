import { Input, Select } from "@windmill/react-ui";
import React from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { useTranslation } from "react-i18next";

//internal import
import { notifyError } from "@/utils/toast";
import Error from "@/components/form/others/Error";
import Title from "@/components/form/others/Title";
import InputArea from "@/components/form/input/InputArea";
import LabelArea from "@/components/form/selectOption/LabelArea";
import SwitchToggle from "@/components/form/switch/SwitchToggle";
import TextAreaCom from "@/components/form/input/TextAreaCom";
import Uploader from "@/components/image-uploader/Uploader";
import useCategorySubmit from "@/hooks/useCategorySubmit";
import CategoryServices from "@/services/CategoryServices";
import DrawerButton from "@/components/form/button/DrawerButton";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const CategoryDrawer = ({ id, data }) => {
  const { t } = useTranslation();

  const {
    checked,
    register,
    onSubmit,
    handleSubmit,
    errors,
    imageUrl,
    setImageUrl,
    published,
    setPublished,
    setChecked,
    selectCategoryName,
    setSelectCategoryName,
    isParentCategory,
    setIsParentCategory,
    handleSelectLanguage,
    isSubmitting,
  } = useCategorySubmit(id, data);

  const { showingTranslateValue } = useUtilsFunction();

  const flattenCategories = (categories = [], depth = 0) =>
    categories.flatMap((category) => [
      {
        _id: category._id,
        name: showingTranslateValue(category.name),
        depth,
      },
      ...(category.children?.length
        ? flattenCategories(category.children, depth + 1)
        : []),
    ]);

  const findObject = (categories, target) => {
    for (const category of categories || []) {
      if (category._id === target) return category;
      const found = findObject(category.children, target);
      if (found) return found;
    }
    return undefined;
  };

  const categoryOptions = flattenCategories(data || []);

  const handleSelect = async (key) => {
    if (key === undefined) return;
    if (!key || key === "home") {
      setChecked("");
      setSelectCategoryName("Home");
      setIsParentCategory(true);
      return;
    }

    if (id) {
      const parentCategoryId = await CategoryServices.getCategoryById(key);

      if (id === key) {
        return notifyError("This can't be select as a parent category!");
      } else if (id === parentCategoryId.parentId) {
        return notifyError("This can't be select as a parent category!");
      } else {
        if (key === undefined) return;
        setChecked(key);
        setIsParentCategory(false);
        const result = findObject(data, key);

        setSelectCategoryName(showingTranslateValue(result?.name));
      }
    } else {
      if (key === undefined) return;
      setChecked(key);
      setIsParentCategory(false);
      const result = findObject(data, key);

      setSelectCategoryName(showingTranslateValue(result?.name));
    }
  };

  return (
    <>
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {id ? (
          <Title
            register={register}
            handleSelectLanguage={handleSelectLanguage}
            title={t("UpdateCategory")}
            description={t("UpdateCategoryDescription")}
          />
        ) : (
          <Title
            register={register}
            handleSelectLanguage={handleSelectLanguage}
            title={t("AddCategoryTitle")}
            description={t("AddCategoryDescription")}
          />
        )}
      </div>

      <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 flex-grow scrollbar-hide w-full max-h-full pb-40">
            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label={t("Name")} />
              <div className="col-span-8 sm:col-span-4">
                <InputArea
                  required={true}
                  register={register}
                  label="Category title"
                  name="name"
                  type="text"
                  placeholder={t("ParentCategoryPlaceholder")}
                />
                <Error errorName={errors.name} />
                <p className="mt-2 text-xs text-gray-500">
                  Yahin jo `Name` likhoge wahi nayi category create hogi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label={t("Description")} />
              <div className="col-span-8 sm:col-span-4">
                <TextAreaCom
                  register={register}
                  label="Description"
                  name="description"
                  type="text"
                  placeholder="Category Description"
                />
                <Error errorName={errors.description} />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label="Category Type" />
              <div className="col-span-8 sm:col-span-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Create as Parent Category
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ON = top-level parent category, OFF = choose existing parent below.
                    </p>
                  </div>
                  <SwitchToggle
                    handleProcess={(value) => {
                      setIsParentCategory(value);
                      if (value) {
                        setChecked("");
                        setSelectCategoryName("Home");
                      }
                    }}
                    processOption={isParentCategory}
                  />
                </div>
                <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-blue-50/50 px-4 py-3">
                  <p className="text-sm font-semibold text-[#0b1d3d]">
                    {isParentCategory
                      ? "Ab jo category add karoge wo Parent Category banegi."
                      : "Ab jo category add karoge wo selected parent ke andar banegi."}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isParentCategory
                      ? "Example: `Lithium Ion Battery Cell` type ka top-level category yahin se create hota hai."
                      : "Neeche dropdown se existing parent choose karo, fir nayi category uske under save hogi."}
                  </p>
                </div>
              </div>
            </div>

            {!isParentCategory ? (
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label={t("ParentCategory")} />
                <div className="col-span-8 sm:col-span-4 relative">
                  <Input
                    readOnly
                    {...register(`parent`, {
                      required: false,
                    })}
                    name="parent"
                    value={selectCategoryName ? selectCategoryName : "Home"}
                    placeholder={t("ParentCategory")}
                    type="text"
                  />

                  <div className="mt-3">
                    <Select
                      className="capitalize"
                      value={checked || "home"}
                      onChange={(e) => handleSelect(e.target.value)}
                    >
                      <option value="home">Select Parent Category</option>
                      {categoryOptions.map((category) => (
                        <option key={category._id} value={category._id}>
                          {`${"— ".repeat(category.depth)}${category.name}`}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-2 text-xs text-gray-500">
                      Existing parent category choose karo. Nayi category uske under save hogi.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label={t("CategoryIcon")} />
              <div className="col-span-8 sm:col-span-4">
                <Uploader
                  imageUrl={imageUrl}
                  setImageUrl={setImageUrl}
                  folder="category"
                  targetWidth={238}
                  targetHeight={238}
                />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label={t("Published")} />
              <div className="col-span-8 sm:col-span-4">
                <SwitchToggle
                  handleProcess={setPublished}
                  processOption={published}
                />
              </div>
            </div>
          </div>

          <DrawerButton id={id} title="Category" isSubmitting={isSubmitting} />
        </form>
      </Scrollbars>
    </>
  );
};

export default CategoryDrawer;
