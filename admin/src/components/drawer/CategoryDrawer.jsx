import { Select } from "@windmill/react-ui";
import React, { useMemo } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  const isSubcategoryPage = location.pathname === "/subcategories";

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
    setSelectCategoryName,
    handleSelectLanguage,
    isSubmitting,
  } = useCategorySubmit(id, data);

  const { showingTranslateValue } = useUtilsFunction();

  const findObject = (categories, target) => {
    for (const category of categories || []) {
      if (category._id === target) return category;
      const found = findObject(category.children, target);
      if (found) return found;
    }
    return undefined;
  };

  const isDescendant = (node, targetId) => {
    if (!node || !node.children) return false;
    for (const child of node.children) {
      if (child._id === targetId || isDescendant(child, targetId)) return true;
    }
    return false;
  };

  // Build recursive flat list for multi-level category hierarchy (category > subcategory > sub-sub)
  const buildOptions = (cats, depth = 0, prefix = "") => {
    let opts = [];
    for (const cat of cats || []) {
      const name = showingTranslateValue(cat.name) || (typeof cat.name === "string" ? cat.name : cat.name?.en || "");
      if (!name) continue;
      const label = depth === 0 ? name : `${prefix} › ${name}`;
      opts.push({
        _id: cat._id,
        name: label,
        depth,
      });
      if (cat.children && cat.children.length > 0) {
        opts = opts.concat(buildOptions(cat.children, depth + 1, label));
      }
    }
    return opts;
  };

  const parentOptions = useMemo(() => {
    const all = buildOptions(data || []);
    if (!id) return all;
    const current = findObject(data, id);
    return all.filter((opt) => opt._id !== id && !isDescendant(current, opt._id));
  }, [data, id]);

  const handleSelect = async (key) => {
    if (!key || key === "home") {
      setChecked("");
      setSelectCategoryName("");
      return;
    }

    if (id && id === key) {
      return notifyError("Cannot select itself as parent.");
    }

    setChecked(key);
    const result = findObject(data, key);
    setSelectCategoryName(showingTranslateValue(result?.name));
  };

  const title = isSubcategoryPage
    ? id
      ? "Update Subcategory"
      : "Add Subcategory"
    : id
      ? "Update Category"
      : "Add Category";

  const description = isSubcategoryPage
    ? "Choose a parent category, then enter the subcategory name."
    : "Main category for All Departments menu.";

  return (
    <>
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Title
          register={register}
          handleSelectLanguage={handleSelectLanguage}
          title={title}
          description={description}
        />
      </div>

      <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 flex-grow scrollbar-hide w-full max-h-full pb-40">
            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label="Name" />
              <div className="col-span-8 sm:col-span-4">
                <InputArea
                  required={true}
                  register={register}
                  label="Name"
                  name="name"
                  type="text"
                  placeholder={
                    isSubcategoryPage
                      ? "e.g. BMS Boards"
                      : "e.g. Lithium Ion Battery"
                  }
                />
                <Error errorName={errors.name} />
              </div>
            </div>

            {isSubcategoryPage ? (
              <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                <LabelArea label="Parent Category" />
                <div className="col-span-8 sm:col-span-4">
                  <Select
                    className="capitalize"
                    value={checked || "home"}
                    onChange={(e) => handleSelect(e.target.value)}
                  >
                    <option value="home">Select parent category</option>
                    {parentOptions.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-2 text-xs text-gray-500">
                    Required. Subcategory will appear under this parent in All
                    Departments.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label="Description" />
              <div className="col-span-8 sm:col-span-4">
                <TextAreaCom
                  register={register}
                  label="Description"
                  name="description"
                  type="text"
                  placeholder="Optional"
                />
                <Error errorName={errors.description} />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
              <LabelArea label="Icon" />
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
              <LabelArea label="Published" />
              <div className="col-span-8 sm:col-span-4">
                <SwitchToggle
                  handleProcess={setPublished}
                  processOption={published}
                />
              </div>
            </div>
          </div>

          <DrawerButton
            id={id}
            title={isSubcategoryPage ? "Subcategory" : "Category"}
            isSubmitting={isSubmitting}
          />
        </form>
      </Scrollbars>
    </>
  );
};

export default CategoryDrawer;
