import { Avatar, TableBody, TableCell, TableRow, Badge } from "@windmill/react-ui";
import { useState } from "react";

//internal import

import CheckBox from "@/components/form/others/CheckBox";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import MainDrawer from "@/components/drawer/MainDrawer";
import CategoryDrawer from "@/components/drawer/CategoryDrawer";
import ShowHideButton from "@/components/table/ShowHideButton";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import useUtilsFunction from "@/hooks/useUtilsFunction";

const PLACEHOLDER =
  "https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png";

const CategoryIcon = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  const showSrc = src && !failed ? src : PLACEHOLDER;

  return (
    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-0.5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
      <img
        className="w-full h-full object-contain rounded"
        src={showSrc}
        alt={alt || "category"}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

const CategoryTable = ({
  data,
  lang,
  isCheck,
  categories,
  setIsCheck,
  useParamId,
  showChild,
  showParentColumn = true,
}) => {
  const { title, serviceId, handleModalOpen, handleUpdate } = useToggleDrawer();
  const { showingTranslateValue } = useUtilsFunction();

  const handleClick = (e) => {
    const { id, checked } = e.target;
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter((item) => item !== id));
    }
  };

  return (
    <>
      {isCheck?.length < 1 && (
        <DeleteModal useParamId={useParamId} id={serviceId} title={title} />
      )}

      <MainDrawer>
        <CategoryDrawer id={serviceId} data={data} lang={lang} />
      </MainDrawer>

      <TableBody>
        {categories?.map((category) => (
          <TableRow key={category._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
            <TableCell>
              <CheckBox
                type="checkbox"
                name="category"
                id={category._id}
                handleClick={handleClick}
                isChecked={isCheck?.includes(category._id)}
              />
            </TableCell>

            <TableCell>
              <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 uppercase">
                {category?._id?.substring(20, 24)}
              </span>
            </TableCell>
            <TableCell>
              <CategoryIcon src={category?.icon} alt={showingTranslateValue(category?.name)} />
            </TableCell>

            <TableCell className="font-medium text-sm min-w-[180px]">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {showingTranslateValue(category?.name)}
              </span>
              {category?.children?.length > 0 && !showChild ? (
                <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                  {category.children.length} sub
                </span>
              ) : null}
            </TableCell>

            {showParentColumn ? (
            <TableCell className="text-xs max-w-[180px]">
              {(() => {
                const parentName = category._parentLabel || category.parentName || "Home";
                const isRoot = !category.parentId || parentName === "Home" || parentName.toLowerCase() === "home";
                return isRoot ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50">
                    <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
                    Home
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-200 border border-slate-200/80 dark:border-gray-600 max-w-[170px] truncate" title={parentName}>
                    <span className="text-slate-400 dark:text-gray-400 mr-1 select-none">↳</span>
                    {parentName}
                  </span>
                );
              })()}
            </TableCell>
            ) : null}

            <TableCell className="text-center">
              <ShowHideButton
                id={category._id}
                category
                status={category.status}
              />
            </TableCell>
            <TableCell>
              <EditDeleteButton
                id={category?._id}
                parent={category}
                isCheck={isCheck}
                children={category?.children}
                handleUpdate={handleUpdate}
                handleModalOpen={handleModalOpen}
                title={showingTranslateValue(category?.name)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default CategoryTable;
