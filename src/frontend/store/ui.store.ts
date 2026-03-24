import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIStoreState = {
  sidebarOpen: boolean;
  menuCollapsed: boolean;
  logOutModal: boolean;
};

type UIStoreActions = {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  toggleMenu: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  setCollapsed: (collapsed: boolean) => void;

  toggleLogoutMenu: () => void;
  openLogoutMenu: () => void;
  closeLogoutMenu: () => void;
};

type UIStore = UIStoreState & UIStoreActions;

const initialUIStoreState: UIStoreState = {
  sidebarOpen: true,
  menuCollapsed: false,
  logOutModal: false,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialUIStoreState,

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      openSidebar: () =>
        set({
          sidebarOpen: true,
        }),

      closeSidebar: () =>
        set({
          sidebarOpen: false,
        }),

      openMenu: () =>
        set({
          menuCollapsed: false,
        }),

      closeMenu: () =>
        set({
          menuCollapsed: true,
        }),

      toggleMenu: () =>
        set((state) => ({
          menuCollapsed: !state.menuCollapsed,
        })),

      setCollapsed: (collapsed) =>
        set({
          menuCollapsed: collapsed,
        }),

      toggleLogoutMenu: () =>
        set((state) => ({
          sidebarOpen: !state.logOutModal,
        })),

      openLogoutMenu: () =>
        set({
          logOutModal: true,
        }),

      closeLogoutMenu: () =>
        set({
          logOutModal: false,
        }),
    }),
    {
      name: "uiState",
    },
  ),
);
