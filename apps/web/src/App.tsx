import { Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { MarketsPage } from "./routes/MarketsPage";
import { MarketDetailPage } from "./routes/MarketDetailPage";
import { CreateMarketPage } from "./routes/CreateMarketPage";
import { PortfolioPage } from "./routes/PortfolioPage";

export function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<MarketsPage />} />
          <Route path="/markets/:id" element={<MarketDetailPage />} />
          <Route path="/create" element={<CreateMarketPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </main>
    </div>
  );
}
