import { useUIStore } from "@frontend/store/ui.store";
import { Drawer, Menu } from "antd";
import Sider from "antd/es/layout/Sider";
import { Link, useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useIsMobile } from "@frontend/hooks/use-mobile";
import type { ItemType } from "antd/es/menu/interface";
import SidebarLabel from "../custom/sidebar-label";
import { BellRing, CircleDot, Home, Settings2 } from "lucide-react";

const SIDEBAR_BG = "#0D1B2E";
const SIDEBAR_WIDTH = 260;

const LogoSection = ({ collapsed }: { collapsed: boolean }) => (
  <div
    className="flex items-center justify-center px-5 border-b border-white/10"
    style={{ height: 64, background: "#0A1628" }}
  >
    <Link
      to="/dashboard"
      className="flex items-center gap-x-3 no-underline group"
    >
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 rounded-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)",
          }}
        />
        <BellRing size={20} strokeWidth={1.5} className="text-white" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span
            className="text-white font-bold tracking-widest text-sm uppercase"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.15em",
            }}
          >
            Siren
          </span>
        </div>
      )}
    </Link>
  </div>
);

const SidebarContent = ({ collapsed }: { collapsed: boolean }) => {
  const { pathname } = useLocation();
  const menu: ItemType[] = [
    {
      key: "/dashboard",
      label: <SidebarLabel to="/dashboard">Dashboard</SidebarLabel>,
      icon: <Home className="size-3.75" />,
    },
    {
      key: "/settings",
      label: <SidebarLabel to="/settings">Settings</SidebarLabel>,
      icon: <Settings2 className="size-3.75" />,
    },
    {
      key: "/sounds",
      label: <SidebarLabel to="/sounds">Sounds</SidebarLabel>,
      icon: <BellRing className="size-3.75" />,
    },
  ];
  return (
    <div
      className="flex flex-col h-full m-0!"
      style={{ background: SIDEBAR_BG }}
    >
      <LogoSection collapsed={collapsed} />
      {!collapsed && (
        <div className="px-5 pt-5 pb-2">
          <span
            className="text-[10px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: "#4A6080", fontFamily: "'DM Sans', sans-serif" }}
          >
            Navigation
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin scrollbar-thumb-white/10">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultSelectedKeys={[pathname]}
          className="cms-sider"
          items={menu}
          style={{ background: "transparent", border: "none" }}
          styles={{
            item: {
              borderRadius: "8px",
              margin: "1px 8px",
              width: "calc(100% - 16px)",
            },
          }}
        />
      </div>
      {!collapsed && (
        <div
          className="px-5 py-4 border-t border-white/10 flex items-center gap-x-3"
          style={{ background: "#0A1628" }}
        >
          <div className="flex items-center gap-x-2 justify-center">
            <CircleDot size={20} className="text-green-500" />
            <span className="text-[#c9a84c]">Scheduler running</span>
          </div>
        </div>
      )}
    </div>
  );
};

const LayoutSidebar = () => {
  const isMobile = useIsMobile();
  const { isOpen, collapsed, setCollapsed, closeSidebar } = useUIStore(
    useShallow((s) => ({
      isOpen: s.sidebarOpen,
      closeSidebar: s.closeSidebar,
      collapsed: s.menuCollapsed,
      setCollapsed: s.setCollapsed,
    })),
  );

  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onClose={closeSidebar}
        placement="left"
        styles={{
          wrapper: { padding: 0 },
          body: { padding: 0, background: SIDEBAR_BG },
          section: { padding: 0 },
          root: { padding: 0 },
        }}
        size={SIDEBAR_WIDTH}
        closable={false}
        mask={{ closable: true, enabled: true, blur: true }}
        className="p-0!"
      >
        <SidebarContent collapsed={false} />
      </Drawer>
    );
  }

  return (
    <Sider
      collapsed={collapsed}
      onCollapse={(c) => setCollapsed(c)}
      theme="dark"
      width={SIDEBAR_WIDTH}
      collapsedWidth={72}
      style={{
        background: SIDEBAR_BG,
        boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
        position: "sticky",
        top: 0,
        height: "100dvh",
        overflow: "hidden",
        flexShrink: 0,
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <SidebarContent collapsed={collapsed} />
    </Sider>
  );
};

export default LayoutSidebar;
