import { type DocRenderer } from "@cyntler/react-doc-viewer";
import ReactMarkdown from "react-markdown";

const MarkdownRenderer: DocRenderer = ({ mainState: { currentDocument } }) => {
  if (!currentDocument) return null;
  const base64String = (currentDocument.fileData as string).split(",")[1];
  const decodedData = atob(base64String);

  return (
    <div id="md-renderer" className="p-4">
      <ReactMarkdown
        className="bg-white"
        components={{
          a: ({ node, ...props }) => <a className="text-base" {...props} />,
          code: ({ node, ...props }) => <code className="text-secondary" {...props} />,
        }}
      >
        {decodedData}
      </ReactMarkdown>
    </div>
  );
};

MarkdownRenderer.fileTypes = ["md", "text/plain"];
MarkdownRenderer.weight = 1;

export default MarkdownRenderer;
