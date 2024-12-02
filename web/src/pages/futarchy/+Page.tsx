import { usePageContext } from "vike-react/usePageContext";
import Home from "../index/+Page";

function FutarchyHome() {
  const context = usePageContext();
  console.log(context.pageId, context.config, context.urlPathname);

  return <Home />;
}

export default FutarchyHome;
