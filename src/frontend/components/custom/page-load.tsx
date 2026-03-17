import { MotionDiv } from "./motion";
import { Loader2Icon } from "lucide-react";

const PageLoad = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-[2px]">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-xl border border-slate-100"
        style={{ boxShadow: "0 10px 25px -5px rgba(13,27,46,0.1)" }}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <Loader2Icon
            className="w-12 h-12 animate-spin text-[#1E3A5F]"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-sm font-bold text-[#0D1B2E] tracking-wide uppercase"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Loading
          </span>
          <div className="h-1 w-12 bg-[#C9A84C]/20 rounded-full overflow-hidden">
            <MotionDiv
              className="h-full bg-[#C9A84C]"
              animate={{ x: [-48, 48] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export default PageLoad;
