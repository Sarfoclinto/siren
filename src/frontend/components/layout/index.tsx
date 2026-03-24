import { Outlet } from "react-router-dom";
import LayoutSidebar from "./sidebar";

const Layout = () => {
  return (
    <main className="w-full min-h-dvh flex bg-[#F4F6FA] relative">
      <LayoutSidebar />
      <div className="w-full h-full flex flex-col min-h-dvh transition-all duration-300 relative">
        <div className="flex-1 p-2 overflow-auto">
          <Outlet />
        </div>
      </div>
    </main>
  );
};
export default Layout;
