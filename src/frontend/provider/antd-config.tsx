import { ConfigProvider } from "antd";
import type { PropsWithChildren } from "react";

// Design tokens
const SIDEBAR_BG = "#0D1B2E";
// const GOLD_ACCENT = "#C9A84C";
const TEXT_DEFAULT = "#ffffff"; // "rgba(255,255,255,0.65)";
const TEXT_SELECTED = "#ffffff";
const HOVER_BG = "rgba(255,255,255,0.06)";
const SELECTED_BG = "rgba(201,168,76,0.15)";

const AntDConfig = ({ children }: PropsWithChildren) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: 8,
        },
        components: {
          Menu: {
            // Dark sidebar tokens
            darkItemBg: SIDEBAR_BG,
            darkSubMenuItemBg: "rgba(0,0,0,0.15)",
            darkItemSelectedBg: SELECTED_BG,
            darkItemSelectedColor: TEXT_SELECTED,
            darkItemHoverBg: HOVER_BG,
            darkItemHoverColor: TEXT_SELECTED,
            darkItemColor: TEXT_DEFAULT,
            darkGroupTitleColor: "rgba(255,255,255,0.3)",
            darkPopupBg: "#122240",

            // Sizing
            iconSize: 15,
            iconMarginInlineEnd: 10,
            itemHeight: 40,
            itemMarginBlock: 1,
            itemMarginInline: 8,
            itemBorderRadius: 8,

            // Font
            // itemFont: "'DM Sans', sans-serif",
            fontSize: 13,
          },
          Drawer: {
            colorBgElevated: SIDEBAR_BG,
          },
          Tooltip: {
            colorBgSpotlight: "#1E3A5F",
            colorTextLightSolid: "#ffffff",
            borderRadius: 6,
            fontSize: 12,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntDConfig;
