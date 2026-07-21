import Link from "next/link";
import { useState } from "react";
import { FiLock, FiMail, FiUser, FiKey } from "react-icons/fi";

import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import InputArea from "@components/form/InputArea";
import useLoginSubmit from "@hooks/useLoginSubmit";
import BottomNavigation from "@components/login/BottomNavigation";
import {
  appendRedirectUrl,
  isCheckoutRedirect,
} from "@utils/authRedirect";

const SignUp = () => {
  const {
    handleSubmit,
    submitHandler,
    sendSignupOtpHandler,
    otpSignupSubmitHandler,
    register,
    errors,
    loading,
    redirectUrl,
  } = useLoginSubmit();
  const [signupMode, setSignupMode] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const loginHref = appendRedirectUrl("/auth/login", redirectUrl);
  const checkoutFlow = isCheckoutRedirect(redirectUrl);

  const handleSendSignupOtp = async (data) => {
    const sent = await sendSignupOtpHandler(data);
    if (sent) {
      setOtpSent(true);
    }
  };

  const handleOtpSignup = async (data) => {
    await otpSignupSubmitHandler(data);
  };

  return (
    <Layout title="Signup" description="this is sign up page">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="py-4 flex flex-col lg:flex-row w-full">
          <div className="w-full sm:p-5 lg:p-8">
            <div className="mx-auto text-left justify-center rounded-md w-full max-w-lg px-4 py-8 sm:p-10 overflow-hidden align-middle transition-all transform bg-white shadow-xl rounded-2x">
              <div className="overflow-hidden mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold font-serif">Create Account</h2>
                  <p className="text-sm text-gray-500 mt-2 mb-4">
                    Register with password or email OTP
                  </p>
                  {checkoutFlow ? (
                    <div className="mb-6 rounded-xl border border-[#0b1d3d]/15 bg-[#0b1d3d]/5 px-4 py-3 text-sm text-[#0b1d3d]">
                      After registering you&apos;ll go straight to{" "}
                      <strong>checkout</strong> — no extra login step.
                    </div>
                  ) : null}
                </div>

                <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupMode("password");
                      setOtpSent(false);
                    }}
                    className={`rounded-md py-2.5 text-sm font-medium transition-all ${
                      signupMode === "password"
                        ? "bg-white text-[#0b1d3d] shadow-sm"
                        : "text-gray-500 hover:text-[#0b1d3d]"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupMode("otp")}
                    className={`rounded-md py-2.5 text-sm font-medium transition-all ${
                      signupMode === "otp"
                        ? "bg-white text-[#0b1d3d] shadow-sm"
                        : "text-gray-500 hover:text-[#0b1d3d]"
                    }`}
                  >
                    Email OTP
                  </button>
                </div>

                {signupMode === "password" ? (
                  <form
                    onSubmit={handleSubmit(submitHandler)}
                    className="flex flex-col justify-center mb-6"
                  >
                    <div className="grid grid-cols-1 gap-5">
                      <div className="form-group">
                        <InputArea
                          register={register}
                          label="Name"
                          name="name"
                          type="text"
                          placeholder="Full Name"
                          Icon={FiUser}
                        />

                        <Error errorName={errors.name} />
                      </div>

                      <div className="form-group">
                        <InputArea
                          register={register}
                          label="Email"
                          name="email"
                          type="email"
                          placeholder="Email"
                          Icon={FiMail}
                        />
                        <Error errorName={errors.email} />
                      </div>
                      <div className="form-group">
                        <InputArea
                          register={register}
                          label="Password"
                          name="password"
                          type="password"
                          placeholder="Password"
                          Icon={FiLock}
                          pattern={
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/
                          }
                          patternMessage={[
                            "1. Password must be at least 8 characters long.",
                            "2. Password must contain at least one uppercase letter.",
                            "3. Password must contain at least one lowercase letter.",
                            "4. Password must contain at least one number.",
                            "5. Password must contain at least one special character.",
                          ]}
                        />
                        <Error errorName={errors.password} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex ms-auto">
                          <Link
                            href={loginHref}
                            className="text-end text-sm text-heading ps-3 underline hover:no-underline focus:outline-none"
                          >
                            Already have account?
                          </Link>
                        </div>
                      </div>
                      {loading ? (
                        <button
                          disabled={loading}
                          type="submit"
                          className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-red-500 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-red-600 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
                        >
                          <img
                            src="/loader/spinner.gif"
                            alt="Loading"
                            width={20}
                            height={10}
                          />
                          <span className="font-serif ml-2 font-light">
                            Processing
                          </span>
                        </button>
                      ) : (
                        <button
                          disabled={loading}
                          type="submit"
                          className="w-full text-center py-3 rounded bg-red-500 text-white hover:bg-red-600 transition-all focus:outline-none my-1"
                        >
                          {checkoutFlow
                            ? "Register & Continue to Checkout"
                            : "Register"}
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <form
                    onSubmit={handleSubmit(handleOtpSignup)}
                    className="flex flex-col justify-center mb-6"
                  >
                    <div className="grid grid-cols-1 gap-5">
                      <div className="form-group">
                        <InputArea
                          register={register}
                          label="Name"
                          name="name"
                          type="text"
                          placeholder="Full Name"
                          Icon={FiUser}
                        />
                        <Error errorName={errors.name} />
                      </div>

                      <div className="form-group">
                        <InputArea
                          register={register}
                          label="Email"
                          name="email"
                          type="email"
                          placeholder="Email"
                          Icon={FiMail}
                        />
                        <Error errorName={errors.email} />
                      </div>

                      {!otpSent ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleSubmit(handleSendSignupOtp)}
                          className="w-full text-center py-3 rounded bg-[#0b1d3d] text-white hover:bg-[#132a52] transition-all focus:outline-none my-1 disabled:opacity-60"
                        >
                          {loading ? "Sending OTP..." : "Send OTP to Email"}
                        </button>
                      ) : (
                        <>
                          <p className="text-sm text-green-600 -mt-2">
                            OTP sent! Check your email inbox (and spam folder).
                          </p>
                          <div className="form-group">
                            <InputArea
                              register={register}
                              label="Enter OTP"
                              name="otp"
                              type="text"
                              placeholder="6-digit OTP"
                              Icon={FiKey}
                              autocomplete="one-time-code"
                            />
                            <Error errorName={errors.otp} />
                          </div>

                          <button
                            type="button"
                            disabled={loading}
                            onClick={handleSubmit(handleSendSignupOtp)}
                            className="text-sm text-[#ED1C24] underline hover:no-underline disabled:opacity-60 text-left"
                          >
                            Resend OTP
                          </button>

                          {loading ? (
                            <button
                              disabled={loading}
                              type="submit"
                              className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-red-500 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-red-600 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
                            >
                              <img
                                src="/loader/spinner.gif"
                                alt="Loading"
                                width={20}
                                height={10}
                              />
                              <span className="font-serif ml-2 font-light">
                                Verifying
                              </span>
                            </button>
                          ) : (
                            <button
                              disabled={loading}
                              type="submit"
                              className="w-full text-center py-3 rounded bg-red-500 text-white hover:bg-red-600 transition-all focus:outline-none my-1"
                            >
                              {checkoutFlow
                                ? "Verify OTP & Continue to Checkout"
                                : "Verify OTP & Create Account"}
                            </button>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex ms-auto">
                          <Link
                            href={loginHref}
                            className="text-end text-sm text-heading ps-3 underline hover:no-underline focus:outline-none"
                          >
                            Already have account?
                          </Link>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                <BottomNavigation
                  desc
                  route="/auth/login"
                  pageName="Login"
                  loginTitle="Sign Up"
                  redirectUrl={redirectUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignUp;
