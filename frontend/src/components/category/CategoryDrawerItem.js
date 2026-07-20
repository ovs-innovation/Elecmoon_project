import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useState, useEffect } from "react";
import {
  IoChevronDownOutline,
  IoChevronForwardOutline,
  IoRemoveSharp,
} from "react-icons/io5";

import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { getCategorySearchUrl } from "@utils/categoryUrl";

const CategoryDrawerItem = ({ title, icon, nested, id, slug }) => {
  const router = useRouter();
  const { closeCategoryDrawer } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  const [show, setShow] = useState(false);
  const [showSubCategory, setShowSubCategory] = useState({
    id: "",
    show: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigateToCategory = (catId, categoryName, categorySlug) => {
    const url = getCategorySearchUrl(catId, categoryName, categorySlug);
    router.prefetch(url);
    router.push(url);
    closeCategoryDrawer();
  };

  const showCategory = (categoryId, categoryName, categorySlug) => {
    if (nested?.length > 0) {
      setShow(!show);
    } else {
      navigateToCategory(categoryId, categoryName, categorySlug);
    }
  };

  const handleSubNestedCategory = (categoryId) => {
    setShowSubCategory({ id: categoryId, show: !showSubCategory.show });
  };

  const handleSubCategory = (categoryId, categoryName, categorySlug) => {
    navigateToCategory(categoryId, categoryName, categorySlug);
  };

  const handleSubSubCategory = (categoryId, categoryName, categorySlug) => {
    navigateToCategory(categoryId, categoryName, categorySlug);
    if (isMobile) {
      closeCategoryDrawer();
    }
  };

  return (
    <div className="relative group">
      <a
        onClick={() => showCategory(id, title, slug)}
        onMouseEnter={() => {
          if (nested?.length > 0) return;
          router.prefetch(getCategorySearchUrl(id, title, slug));
        }}
        className="p-3 flex items-center rounded-md hover:bg-gray-50 w-full hover:text-[#ED1C24] transition-colors duration-200 cursor-pointer"
        role="button"
      >
        {icon ? (
          <Image
            src={icon}
            width={20}
            height={20}
            alt="Category"
            className="flex-shrink-0"
          />
        ) : (
          <Image
            src="https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png"
            width={20}
            height={20}
            alt="category"
            className="flex-shrink-0"
          />
        )}

        <div className="inline-flex items-center justify-between ml-3 text-sm font-medium w-full hover:text-[#ED1C24]">
          <span className="truncate">{title}</span>
          {nested?.length > 0 ? (
            <span className="transition duration-300 ease-in-out inline-flex loading-none items-end text-gray-400 ml-2 flex-shrink-0">
              {show ? <IoChevronDownOutline /> : <IoChevronForwardOutline />}
            </span>
          ) : null}
        </div>
      </a>

      {show && nested.length > 0 ? (
        <div className="border-l-2 border-gray-100 ml-4 mt-1">
          <ul className="space-y-1">
            {nested.map((children) => (
              <li key={children._id} className="relative">
                {children.children.length > 0 ? (
                  <a
                    onClick={() => handleSubNestedCategory(children._id)}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-[#ED1C24] hover:bg-gray-50 cursor-pointer transition-colors duration-200 rounded-md"
                  >
                    <span className="text-xs text-gray-400 mr-2">
                      <IoRemoveSharp />
                    </span>

                    <div className="inline-flex items-center justify-between w-full">
                      <span className="truncate">
                        {`for ${showingTranslateValue(children.name)}`}
                      </span>
                      <span className="transition duration-300 ease-in-out inline-flex loading-none items-end text-gray-400 ml-2 flex-shrink-0">
                        {showSubCategory.id === children._id &&
                        showSubCategory.show ? (
                          <IoChevronDownOutline />
                        ) : (
                          <IoChevronForwardOutline />
                        )}
                      </span>
                    </div>
                  </a>
                ) : (
                  <a
                    onClick={() =>
                      handleSubCategory(
                        children._id,
                        showingTranslateValue(children.name),
                        children.slug
                      )
                    }
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-[#ED1C24] hover:bg-gray-50 cursor-pointer transition-colors duration-200 rounded-md"
                  >
                    <span className="text-xs text-gray-400 mr-2">
                      <IoRemoveSharp />
                    </span>
                    <span className="truncate">
                      {`for ${showingTranslateValue(children.name)}`}
                    </span>
                  </a>
                )}

                {showSubCategory.id === children._id &&
                showSubCategory.show === true &&
                children.children.length > 0 ? (
                  <div className="border-l-2 border-gray-100 ml-4 mt-1">
                    <ul className="space-y-1">
                      {children.children.map((subChildren) => (
                        <li key={subChildren._id}>
                          <a
                            onClick={() =>
                              handleSubSubCategory(
                                subChildren._id,
                                showingTranslateValue(subChildren?.name),
                                subChildren.slug
                              )
                            }
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-[#ED1C24] hover:bg-gray-50 cursor-pointer transition-colors duration-200 rounded-md"
                          >
                            <span className="text-xs text-gray-400 mr-2">
                              <IoRemoveSharp />
                            </span>
                            <span className="truncate">
                              {`for ${showingTranslateValue(subChildren?.name)}`}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default CategoryDrawerItem;
