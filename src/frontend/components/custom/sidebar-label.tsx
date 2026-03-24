import { cn } from "@frontend/lib/utils";
import { useUIStore } from "@frontend/store/ui.store";
import { NavLink, type NavLinkProps } from "react-router-dom";
import { Tooltip } from "antd";

type SidebarLabelProps = {
  type?: "link" | "span";
  icon?: React.ReactNode;
  showIconWhenCollapsed?: boolean;
  hideTextWhenCollapsed?: boolean;
  tooltip?: string;
} & Omit<NavLinkProps, "className"> & {
    className?: string;
  };

const SidebarLabel = ({
  to,
  icon,
  className,
  children,
  type = "link",
  showIconWhenCollapsed = true,
  // hideTextWhenCollapsed = false,
  tooltip,
  ...props
}: SidebarLabelProps) => {
  const collapsed = useUIStore((s) => s.menuCollapsed);

  const showIcon = !!icon && (!collapsed || showIconWhenCollapsed);
  // const showText = !collapsed || !hideTextWhenCollapsed;
  const showText = true;

  const baseClasses = cn(
    "flex items-center gap-x-2.5 w-full",
    "text-[13px] font-medium",
    "text-slate-300. text-black",
    "transition-colors duration-150",
    className,
  );

  const content = (
    <div className="flex items-center ">
      {showIcon && <span className="text-slate-400 shrink-0 ">{icon}</span>}
      {showText && (
        <span
          className={cn("truncate text-white ")}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          {children as unknown as React.ReactNode}
        </span>
      )}
    </div>
  );

  const spanEl = collapsed ? (
    <Tooltip
      placement="right"
      title={tooltip ?? (typeof children === "string" ? children : "")}
    >
      <span className={baseClasses}>{content}</span>
    </Tooltip>
  ) : (
    <span className={baseClasses}>{content}</span>
  );

  if (type === "span") return spanEl;

  return (
    <NavLink
      {...props}
      to={to}
      className={({ isActive }) =>
        cn(
          baseClasses,
          "px-2.5 py-1.5 rounded-md text-black!. .",
          !collapsed ? "text-black!" : "text-white!",
          isActive
            ? "text-white bg-white/10 font-semibold"
            : "hover:text-white hover:bg-white/5",
        )
      }
    >
      {content}
    </NavLink>
  );
};

export default SidebarLabel;
