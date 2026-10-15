import { Outlet } from "react-router-dom";
import ScrollToHash from "../components/ScrollToHash";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <ScrollToHash />
      <PublicHeader />

      <div className="public-layout-content">
        <Outlet />
      </div>

      <PublicFooter />
    </div>
  );
}