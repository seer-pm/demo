import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CreateMarket from "./pages/CreateMarket";
import Home from "./pages/Home";
import Market from "./pages/Market";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="create-market" element={<CreateMarket />} />
          <Route path="markets/:id" element={<Market />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
