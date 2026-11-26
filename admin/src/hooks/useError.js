import Cookies from "js-cookie";
import { useContext } from "react";

//internal import
import { notifyError } from "@/utils/toast";
import { AdminContext } from "@/context/AdminContext";

const useError = () => {
  const { dispatch } = useContext(AdminContext);

  const handleErrorNotification = async (err, from, time = 1000) => {
    console.log(
      `handleErrorNotification, error on ${from}`,
      err?.response?.data?.message || err?.message
    );
    const msg = err?.response?.data?.message || "";
    if (
      err?.response?.status === 401 ||
      msg === "jwt expired" ||
      msg === "jwt malformed" ||
      msg === "invalid signature" ||
      msg === "Unauthorized Access!" ||
      msg === "Invalid session. Please sign in again." ||
      msg === "Your session has expired. Please sign in again." ||
      msg === "Authorization token is required."
    ) {
      console.log("inside 401 / session expired", msg);
      dispatch({ type: "USER_LOGOUT" });
      Cookies.remove("adminInfo");
      notifyError(msg || "Your session has expired. Please sign in again.", time);

      const timeoutId = setTimeout(() => {
        window.location.replace("/login");
      }, 1500);
      return () => clearTimeout(timeoutId);
    } else {
      notifyError(msg || err?.message, time);
    }
  };

  return {
    handleErrorNotification,
  };
};

export default useError;
