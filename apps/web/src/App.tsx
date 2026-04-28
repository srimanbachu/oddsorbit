import { Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { MarketsPage } from "./routes/MarketsPage";
import { MarketDetailPage } from "./routes/MarketDetailPage";

export function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<MarketsPage />} />
          <Route path="/markets/:id" element={<MarketDetailPage />} />
          <Route path="/portfolio" element={<div className="p-6">Portfolio (coming soon)</div>} />
        </Routes>
      </main>
    </div>
  );
}
