import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layout/PublicLayout";
import ComingSoonPage from "./pages/ComingSoonPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ReportDetailsPage from "./pages/ReportDetailsPage";
import MyPetsPage from "./pages/MyPetsPage";
import PetPassportPage from "./pages/PetPassportPage";
import ReportsMapPage from "./pages/ReportsMapPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AddPetPage from "./pages/AddPetPage";
import NewReportPage from "./pages/NewReportPage";
import MyActivityPage from "./pages/MyActivityPage";
  import ContactPage from "./pages/ContactPage";
function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/reports/map" element={<ReportsMapPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/reports/new" element={<NewReportPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-pets" element={<MyPetsPage />} />
          <Route path="/my-pets/:id" element={<PetPassportPage />} />
          <Route path="/my-pets/new" element={<AddPetPage />} />
          <Route path="/my-activity" element={<MyActivityPage />} />
        </Route>

        <Route path="/reports/:id" element={<ReportDetailsPage />} />

        <Route
          path="*"
          element={
            <ComingSoonPage
              title="Page not found"
              description="The page you requested does not exist."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;