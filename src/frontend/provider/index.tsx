import React, { type FC, type PropsWithChildren } from "react";
import { Toaster } from "sonner";

const Provider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <React.Suspense>
      <Toaster position="top-right" richColors />
      {children}
    </React.Suspense>
  );
};
export default Provider;
