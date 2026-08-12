import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { AppShell } from "./AppShell";
import { PartageView } from "./components/PartageView";
import { TarifsPage } from "./components/TarifsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        <Route path="/app" element={<AppShell />} />
        <Route path="/partage" element={<PartageView />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
