import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layout/PublicLayout";
import ComingSoonPage from "./pages/ComingSoonPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import MyPetsPage from "./pages/MyPetsPage";
import PetPassportPage from "./pages/PetPassportPage";
import ReportsMapPage from "./pages/ReportsMapPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AddPetPage from "./pages/AddPetPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/reports/map"
          element={<ReportsMapPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/reports/new"
          element={
            <ComingSoonPage
              title="Report an animal"
              description="The animal report form is currently being prepared."
            />
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-pets" element={<MyPetsPage />} />
          <Route path="/my-pets/:id" element={<PetPassportPage />} />
          <Route path="/my-pets/new" element={<AddPetPage />} />
        </Route>

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