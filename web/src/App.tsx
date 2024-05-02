import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CreateMarketPage from "./pages/CreateMarkePage";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import MarketVerifyPage from "./pages/MarketVerifyPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="create-market" element={<CreateMarketPage />} />
          <Route path="markets/:chainId/:id" element={<MarketPage />} />
          <Route path="markets/:chainId/:id/verify" element={<MarketVerifyPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
