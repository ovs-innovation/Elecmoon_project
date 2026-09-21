import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiDownload, FiEye, FiFileText, FiTrash2, FiUploadCloud } from "react-icons/fi";

import {
  getAdminCloudinaryConfig,
  getCloudinaryErrorMessage,
  uploadPdfToCloudinary,
  validatePdfFile,
} from "@/utils/cloudinaryUpload";
import { notifyError, notifySuccess } from "@/utils/toast";

const getDownloadUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (url.includes("/fl_attachment")) return url;
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
};

const DatasheetUploader = ({ datasheetUrl, setDatasheetUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) return;

      const validationError = validatePdfFile(file);
      if (validationError) {
        notifyError(validationError);
        return;
      }

      const config = getAdminCloudinaryConfig();
      if (!config.valid) {
        notifyError(config.error);
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        const url = await uploadPdfToCloudinary({
          file,
          folder: "product-datasheets",
          config,
          onProgress: setProgress,
        });
        setDatasheetUrl(url);
        notifySuccess("Datasheet uploaded successfully.");
      } catch (error) {
        notifyError(getCloudinaryErrorMessage(error));
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [setDatasheetUrl]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      {datasheetUrl ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center gap-2 text-sm text-green-800 font-medium min-w-0">
            <FiFileText className="shrink-0" />
            <span className="truncate">Datasheet attached</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-green-700 px-2 py-1 border border-gray-200 rounded bg-white"
            >
              <FiEye /> View
            </a>
            <a
              href={getDownloadUrl(datasheetUrl)}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-green-700 px-2 py-1 border border-gray-200 rounded bg-white"
            >
              <FiDownload /> Download
            </a>
            <button
              type="button"
              onClick={() => setDatasheetUrl("")}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove datasheet"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      ) : null}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-green-500 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="mx-auto text-2xl text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {uploading
            ? `Uploading… ${progress}%`
            : datasheetUrl
              ? "Drop a new PDF to replace, or click to browse"
              : "Drop PDF datasheet here, or click to browse"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF only, max 10 MB</p>
      </div>
    </div>
  );
};

export default DatasheetUploader;
