import { FiDownload, FiEye, FiFileText } from "react-icons/fi";
import { getDatasheetDownloadUrl } from "@utils/datasheet";

/**
 * View / Download buttons for a product datasheet PDF.
 */
const DatasheetActions = ({
  url,
  className = "",
  size = "md",
  stopPropagation = false,
}) => {
  if (!url) return null;

  const downloadUrl = getDatasheetDownloadUrl(url);
  const isCompact = size === "sm";

  const baseBtn = isCompact
    ? "inline-flex items-center justify-center gap-1.5 flex-1 border border-gray-200 hover:border-[#ED1C24] hover:text-[#ED1C24] text-gray-800 py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-colors"
    : "inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#0b1d3d] border border-gray-200 hover:border-[#ED1C24] hover:text-[#ED1C24] rounded-xl px-4 py-2.5 transition-colors";

  const onClick = stopPropagation
    ? (e) => {
        e.stopPropagation();
      }
    : undefined;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {!isCompact ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mr-1">
          <FiFileText className="w-3.5 h-3.5" />
          Datasheet
        </span>
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={baseBtn}
      >
        <FiEye className={isCompact ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4"} />
        View
      </a>
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={onClick}
        className={baseBtn}
      >
        <FiDownload
          className={isCompact ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4"}
        />
        Download
      </a>
    </div>
  );
};

export default DatasheetActions;
