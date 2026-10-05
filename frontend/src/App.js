import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import ToolDetail from "@/pages/ToolDetail";
import Wizard from "@/pages/Wizard";
import Decide from "@/pages/Decide";
import Guidance from "@/pages/Guidance";
import PlatformView from "@/pages/PlatformView";
import StageView from "@/pages/StageView";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/decide" element={<Decide />} />
              <Route path="/guidance" element={<Guidance />} />
              <Route path="/tools/:id" element={<ToolDetail />} />
              <Route path="/tools/:id/setup" element={<Wizard />} />
              <Route path="/platform/:id" element={<PlatformView />} />
              <Route path="/stage/:id" element={<StageView />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
