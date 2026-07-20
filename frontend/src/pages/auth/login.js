import Link from "next/link";
import { FiLock, FiMail } from "react-icons/fi";

import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import useLoginSubmit from "@hooks/useLoginSubmit";
import InputArea from "@components/form/InputArea";
import BottomNavigation from "@components/login/BottomNavigation";
import {
  appendRedirectUrl,
  isCheckoutRedirect,
} from "@utils/authRedirect";

const Login = () => {
  const { handleSubmit, submitHandler, register, errors, loading, redirectUrl } =
    useLoginSubmit();
  const signupHref = appendRedirectUrl("/auth/signup", redirectUrl);
  const forgetHref = appendRedirectUrl("/auth/forget-password", redirectUrl);
  const checkoutFlow = isCheckoutRedirect(redirectUrl);

  return (
    <Layout title="Login" description="This is login page">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="py-4 flex flex-col lg:flex-row w-full">
          <div className="w-full sm:p-5 lg:p-8">
            <div className="mx-auto text-left justify-center rounded-md w-full max-w-lg px-4 py-8 sm:p-10 overflow-hidden align-middle transition-all transform bg-white shadow-xl rounded-2x">
              <div className="overflow-hidden mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold font-serif">Login</h2>
                  <p className="text-sm md:text-base text-gray-500 mt-2 mb-4">
                    Login with your email and password
                  </p>
                  {checkoutFlow ? (
                    <div className="mb-6 rounded-xl border border-[#ED1C24]/20 bg-[#ED1C24]/5 px-4 py-3 text-sm text-[#0b1d3d]">
                      Sign in to continue to <strong>checkout</strong>. New here?{" "}
                      <Link href={signupHref} className="font-bold text-[#ED1C24] hover:underline">
                        Create an account
                      </Link>{" "}
                      — no need to log in again after registering.
                    </div>
                  ) : null}
                </div>
                <form
                  onSubmit={handleSubmit(submitHandler)}
                  className="flex flex-col justify-center"
                >
                  <div className="grid grid-cols-1 gap-5">
                    <div className="form-group">
                      <InputArea
                        register={register}
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        Icon={FiMail}
                        autocomplete="email"
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
                        autocomplete="current-password"
                      />

                      <Error errorName={errors.password} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex ms-auto">
                        <Link
                          href={forgetHref}
                          className="text-end text-sm text-heading ps-3 underline hover:no-underline focus:outline-none"
                        >
                          Forgot password?
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
                        {checkoutFlow ? "Login & Continue to Checkout" : "Login"}
                      </button>
                    )}
                  </div>
                </form>
                <BottomNavigation
                  or={true}
                  route="/auth/signup"
                  pageName="Sign Up"
                  loginTitle="Login"
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

export default Login;
