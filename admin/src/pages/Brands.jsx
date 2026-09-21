import {
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
} from "@windmill/react-ui";
import React, { useContext, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import BrandTable from "@/components/brand/BrandTable";
import BrandDrawer from "@/components/drawer/BrandDrawer";
import MainDrawer from "@/components/drawer/MainDrawer";
import DeleteModal from "@/components/modal/DeleteModal";
import CheckBox from "@/components/form/others/CheckBox";
import PageTitle from "@/components/Typography/PageTitle";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import AnimatedContent from "@/components/common/AnimatedContent";
import { SidebarContext } from "@/context/SidebarContext";
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import BrandServices from "@/services/BrandServices";

const Brands = () => {
  const { toggleDrawer } = useContext(SidebarContext);
  const { allId, handleDeleteMany } = useToggleDrawer();
  const { data, loading, error } = useAsync(BrandServices.getAllBrands);

  const {
    totalResults,
    resultsPerPage,
    dataTable,
    handleChangePage,
    serviceData,
  } = useFilter(data || []);

  const [isCheckAll, setIsCheckAll] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [search, setSearch] = useState("");

  const filtered = (dataTable || []).filter((b) =>
    String(b.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    setIsCheckAll(!isCheckAll);
    setIsCheck((data || []).map((li) => li._id));
    if (isCheckAll) setIsCheck([]);
  };

  return (
    <>
      <PageTitle>Brands</PageTitle>
      <DeleteModal
        ids={allId}
        setIsCheck={setIsCheck}
        title="Selected Brands"
      />
      <MainDrawer>
        <BrandDrawer />
      </MainDrawer>

      <AnimatedContent>
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex md:justify-between">
              <div className="w-full md:w-1/2">
                <Input
                  type="search"
                  placeholder="Search brand"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/2 flex gap-2 justify-end">
                {isCheck.length > 0 && (
                  <Button
                    onClick={() => handleDeleteMany(isCheck)}
                    className="rounded-md h-12 bg-red-500"
                  >
                    <span className="mr-2">
                      <FiTrash2 />
                    </span>
                    Delete
                  </Button>
                )}
                <Button onClick={toggleDrawer} className="rounded-md h-12">
                  <span className="mr-2">
                    <FiPlus />
                  </span>
                  Add Brand
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {loading ? (
          <TableLoading row={8} col={5} width={120} height={20} />
        ) : error ? (
          <span className="text-center mx-auto text-red-500">{error}</span>
        ) : serviceData?.length !== 0 ? (
          <TableContainer className="mb-8">
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>
                    <CheckBox
                      type="checkbox"
                      name="selectAll"
                      id="selectAll"
                      handleClick={handleSelectAll}
                      isChecked={isCheckAll}
                    />
                  </TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell className="text-center">Slug</TableCell>
                  <TableCell className="text-center">Status</TableCell>
                  <TableCell className="text-right">Actions</TableCell>
                </tr>
              </TableHeader>
              <BrandTable
                brands={filtered}
                isCheck={isCheck}
                setIsCheck={setIsCheck}
              />
            </Table>
            <TableFooter>
              <Pagination
                totalResults={totalResults}
                resultsPerPage={resultsPerPage}
                onChange={handleChangePage}
                label="Brand Page Navigation"
              />
            </TableFooter>
          </TableContainer>
        ) : (
          <NotFound title="Brands" />
        )}
      </AnimatedContent>
    </>
  );
};

export default Brands;
