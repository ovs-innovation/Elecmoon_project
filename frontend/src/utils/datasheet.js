/** Force browser download for Cloudinary-hosted PDFs */
export const getDatasheetDownloadUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (url.includes("/fl_attachment")) return url;
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
};
