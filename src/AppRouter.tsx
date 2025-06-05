import { BrowserRouter, Route, Routes } from "react-router-dom";

import Index from "./pages/Index";
import Create from "./pages/Create";
import Projects from "./pages/Projects";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/create" element={<Create />} />
        <Route path="/create/:projectId" element={<Create />} />
        <Route path="/gallery" element={<Gallery />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;