import { Outlet } from "react-router-dom";
import ScrollToHash from "../components/ScrollToHash";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";

export default function PublicLayout() {
  return (
    <>
      <ScrollToHash />
      <PublicHeader />
      <Outlet />
      <PublicFooter />
    </>
  );
}