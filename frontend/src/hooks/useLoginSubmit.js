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
      loginType: "password",
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

  const completeOtpLogin = async (email, otp) => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      otp,
      loginType: "otp",
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

  const sendSignupOtpHandler = async ({ name, email }) => {
    setLoading(true);
    try {
      const res = await CustomerServices.sendSignupOtp({ name, email });
      notifySuccess(res.message);
      return true;
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeSignupOtp = async (name, email, otp) => {
    const result = await signIn("credentials", {
      redirect: false,
      name,
      email,
      otp,
      loginType: "signup-otp",
    });

    if (result?.error) {
      notifyError(result?.error);
      return false;
    }

    if (result?.ok) {
      notifySuccess("Account created successfully!");
      router.push(getSafeRedirectUrl(redirectUrl));
      return true;
    }

    return false;
  };

  const otpSignupSubmitHandler = async ({ name, email, otp }) => {
    setLoading(true);
    try {
      await completeSignupOtp(name, email, otp);
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  const sendOtpHandler = async (email) => {
    setLoading(true);
    try {
      const res = await CustomerServices.sendLoginOtp({ email });
      notifySuccess(res.message);
      return true;
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const otpSubmitHandler = async ({ email, otp }) => {
    setLoading(true);
    try {
      await completeOtpLogin(email, otp);
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
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
    sendOtpHandler,
    otpSubmitHandler,
    sendSignupOtpHandler,
    otpSignupSubmitHandler,
    redirectUrl,
  };
};

export default useLoginSubmit;
