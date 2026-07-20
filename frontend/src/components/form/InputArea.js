import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Label from "@components/form/Label";

const InputArea = ({
  name,
  label,
  type,
  Icon,
  register,
  readOnly,
  defaultValue,
  autocomplete,
  placeholder,
  required = true,
  pattern,
  patternMessage = "Invalid input",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <>
      <Label label={label} />
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-800 focus-within:text-gray-900 sm:text-base">
              <Icon />
            </span>
          </div>
        )}
        <input
          {...register(`${name}`, {
            required: required ? `${label} is required!` : false,
            pattern: pattern
              ? {
                  value: pattern,
                  message: patternMessage,
                }
              : undefined,
          })}
          type={inputType}
          name={name}
          readOnly={readOnly}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete={autocomplete}
          className={`${
            Icon ? "py-2 pl-10" : "py-2 px-4 md:px-5"
          } ${isPasswordField ? "pr-11" : ""} w-full appearance-none border text-sm opacity-75 text-input rounded-md placeholder-body min-h-12 transition duration-200 focus:ring-0 ease-in-out bg-white border-gray-200 focus:outline-none focus:border-[#0b1d3d] h-11 md:h-12 ${
            readOnly ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
          }`}
        />
        {isPasswordField && !readOnly ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-[#0b1d3d] transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <FiEyeOff className="w-[18px] h-[18px]" />
            ) : (
              <FiEye className="w-[18px] h-[18px]" />
            )}
          </button>
        ) : null}
      </div>
    </>
  );
};

export default InputArea;
