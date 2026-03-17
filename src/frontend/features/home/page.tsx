import paths from "@frontend/config/routes";
import { Navigate } from "react-router-dom";

const Page = () => {
  return <Navigate to={paths.auth.login.href} replace />;
};
export default Page;
