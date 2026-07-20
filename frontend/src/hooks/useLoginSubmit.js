import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";

import { notifyError, notifySuccess } from "@utils/toast";
import CustomerServices from "@services/CustomerServices";
import {
  appendRedirectUrl,
  getSafeRedirectUrl,
} from "@utils/authRedirect";

const useLoginSubmit = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const redirectUrl = router.query?.redirectUrl;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const completeCredentialsLogin = async (email, password) => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      notifyError(result?.error);
      return false;
    }

    if (result?.ok) {
      router.push(getSafeRedirectUrl(redirectUrl));
      return true;
    }

    return false;
  };

  const submitHandler = async ({ name, email, password, phone }) => {
    setLoading(true);

    try {
      if (router.pathname === "/auth/signup") {
        await CustomerServices.verifyEmailAddress({
          name,
          email,
          password,
        });

        notifySuccess("Account created successfully!");
        const loggedIn = await completeCredentialsLogin(email, password);

        if (!loggedIn) {
          router.push(appendRedirectUrl("/auth/login", redirectUrl));
        }

        setLoading(false);
        return;
      }

      if (router.pathname === "/auth/forget-password") {
        const res = await CustomerServices.forgetPassword({
          email,
        });

        notifySuccess(res.message);
        setLoading(false);
        return;
      }

      if (router.pathname === "/auth/phone-signup") {
        const res = await CustomerServices.verifyPhoneNumber({
          phone,
        });
        notifySuccess(res.message);
        setLoading(false);
        return;
      }

      const loggedIn = await completeCredentialsLogin(email, password);
      setLoading(false);
      if (!loggedIn) {
        return;
      }
    } catch (error) {
      console.error(
        "Error in submitHandler:",
        error?.response?.data?.message || error?.message
      );
      setLoading(false);
      notifyError(error?.response?.data?.message || error?.message);
    }
  };

  return {
    register,
    errors,
    loading,
    control,
    handleSubmit,
    submitHandler,
    redirectUrl,
  };
};

export default useLoginSubmit;
