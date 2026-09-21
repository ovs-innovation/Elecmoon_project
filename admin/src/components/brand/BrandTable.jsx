import { TableBody, TableCell, TableRow } from "@windmill/react-ui";
import React from "react";
import CheckBox from "@/components/form/others/CheckBox";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import MainDrawer from "@/components/drawer/MainDrawer";
import BrandDrawer from "@/components/drawer/BrandDrawer";
import EditDeleteButton from "@/components/table/EditDeleteButton";
import ShowHideButton from "@/components/table/ShowHideButton";

const BrandTable = ({ brands, isCheck, setIsCheck }) => {
  const { title, serviceId, handleModalOpen, handleUpdate } = useToggleDrawer();

  const handleClick = (e) => {
    const { id, checked } = e.target;
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter((item) => item !== id));
    }
  };

  return (
    <>
      {isCheck.length < 1 && <DeleteModal id={serviceId} title={title} />}

      <MainDrawer>
        <BrandDrawer id={serviceId} />
      </MainDrawer>

      <TableBody>
        {brands?.map((brand) => (
          <TableRow key={brand._id}>
            <TableCell>
              <CheckBox
                type="checkbox"
                name={brand.name}
                id={brand._id}
                handleClick={handleClick}
                isChecked={isCheck.includes(brand._id)}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-8 h-8 object-contain rounded border border-gray-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {brand.name?.[0] || "B"}
                  </div>
                )}
                <span className="font-medium text-sm">{brand.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <span className="text-sm text-gray-500">{brand.slug || "—"}</span>
            </TableCell>
            <TableCell className="text-center">
              <ShowHideButton id={brand._id} status={brand.status} />
            </TableCell>
            <TableCell>
              <EditDeleteButton
                title={brand.name}
                id={brand._id}
                handleUpdate={handleUpdate}
                handleModalOpen={handleModalOpen}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default BrandTable;
