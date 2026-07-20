import { Avatar, TableBody, TableCell, TableRow } from "@windmill/react-ui";
import { Link } from "react-router-dom";
import { useState } from "react";
import { IoRemoveSharp } from "react-icons/io5";

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
    <Avatar
      className="hidden mr-3 md:block bg-gray-50 p-1"
      src={showSrc}
      alt={alt || "category"}
      onError={() => setFailed(true)}
    />
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
          <TableRow key={category._id}>
            <TableCell>
              <CheckBox
                type="checkbox"
                name="category"
                id={category._id}
                handleClick={handleClick}
                isChecked={isCheck?.includes(category._id)}
              />
            </TableCell>

            <TableCell className="font-semibold uppercase text-xs">
              {category?._id?.substring(20, 24)}
            </TableCell>
            <TableCell>
              <CategoryIcon src={category?.icon} alt={showingTranslateValue(category?.name)} />
            </TableCell>

            <TableCell className="font-medium text-sm min-w-[180px]">
              <div
                className="flex items-start gap-1"
                style={{ paddingLeft: `${(category._depth || 0) * 16}px` }}
              >
                {(category._depth || 0) > 0 ? (
                  <IoRemoveSharp className="text-gray-400 mt-0.5 flex-shrink-0" />
                ) : null}
                {category?.children?.length > 0 && !showChild ? (
                  <Link
                    to={`/categories/${category?._id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {showingTranslateValue(category?.name)}
                  </Link>
                ) : (
                  <span>{showingTranslateValue(category?.name)}</span>
                )}
              </div>
              {showChild && category?.children?.length > 0 ? (
                <p className="text-[10px] text-gray-400 mt-1 pl-4">
                  {category.children.length} sub-categor
                  {category.children.length === 1 ? "y" : "ies"}
                </p>
              ) : null}
            </TableCell>
            <TableCell className="text-xs text-gray-500 max-w-[140px]">
              {category._parentLabel ||
                category.parentName ||
                (category.parentId ? "—" : "Top level")}
            </TableCell>

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
