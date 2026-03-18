import { cn } from "@frontend/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;

  btnClassName?: string;
  titleClassName?: string;
  collapseClassname?: string;
  className?: string;

  /**
   * If true, children stay mounted even when closed.
   * Useful for forms (keeps input state).
   */
  keepMounted?: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  collapsible = false,
  defaultOpen = true,
  children,
  badge,
  btnClassName,
  titleClassName,
  collapseClassname,
  className,
  keepMounted = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  // For animation
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">(
    defaultOpen ? "auto" : 0,
  );

  const contentId = useId();

  // Measure content height when opening/closing
  useLayoutEffect(() => {
    if (!collapsible) return;

    const el = contentRef.current;
    if (!el) return;

    if (open) {
      const fullHeight = el.scrollHeight;
      setHeight(fullHeight);

      // after animation, switch to auto so dynamic content works
      const t = setTimeout(() => setHeight("auto"), 250);
      return () => clearTimeout(t);
    } else {
      // if currently auto, we need to set fixed height before animating to 0
      const fullHeight = el.scrollHeight;
      setHeight(fullHeight);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [open, collapsible]);

  // If defaultOpen changes externally (optional)
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const toggle = () => {
    if (!collapsible) return;
    setOpen((o) => !o);
  };

  const showContent = keepMounted ? true : open;

  return (
    <div
      className={cn(
        "border border-gray-100 rounded-xl overflow-hidden shadow-sm",
        "transition-shadow hover:shadow-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={collapsible ? open : undefined}
        aria-controls={collapsible ? contentId : undefined}
        className={cn(
          "w-full flex items-center gap-2.5 px-4 py-3",
          "bg-gray-50/70. border-b border-gray-100",
          "transition-colors duration-200",
          collapsible
            ? "cursor-pointer hover:bg-gray-100/70. active:scale-[0.997]"
            : "cursor-default",
          btnClassName,
        )}
      >
        <span className="text-gray-500">{icon}</span>

        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-widest text-gray-600 flex-1 text-left",
            titleClassName,
          )}
        >
          {title}
        </span>

        {badge && <span className="mr-1">{badge}</span>}

        {collapsible && (
          <ChevronDown
            size={14}
            className={cn(
              "text-gray-400 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
              collapseClassname,
            )}
          />
        )}
      </button>

      {showContent && (
        <div
          id={contentId}
          ref={contentRef}
          style={{
            height: collapsible ? height : "auto",
          }}
          className={cn(
            "overflow-hidden",
            collapsible && "transition-[height] duration-250 ease-out",
          )}
        >
          <div
            className={cn(
              "px-4 py-3.5 space-y-4",
              collapsible &&
                "transition-opacity duration-200 ease-out will-change-opacity",
              collapsible && open ? "opacity-100" : "opacity-0",
            )}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Section;
