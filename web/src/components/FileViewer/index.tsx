import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import React from "react";
import "@cyntler/react-doc-viewer/dist/index.css";
import { ExternalLinkIcon } from "@/lib/icons";
import MarkdownRenderer from "./MarkdownViewer";

const FileViewer: React.FC<{ url: string }> = ({ url }) => {
  const docs = [{ uri: url }];

  return (
    <div>
      <div className="h-fit flex flex-col justify-end items-end px-7 py-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-65 text-purple-primary flex items-center p-2 space-x-2"
        >
          Open PDF in new tab <ExternalLinkIcon />
        </a>
      </div>
      <div className="text-primaryText  justify-center items-center mx-auto">
        <DocViewer
          documents={docs}
          pluginRenderers={[...DocViewerRenderers, MarkdownRenderer]}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
            },
            pdfZoom: {
              defaultZoom: 0.7,
              zoomJump: 0.1,
            },
            pdfVerticalScrollByDefault: true,
          }}
          className="bg-primaryBackground"
        />
      </div>
    </div>
  );
};

export default FileViewer;
