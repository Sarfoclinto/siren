import React, { type FC, type PropsWithChildren } from "react";
import { Toaster } from "sonner";
import AntDConfig from "./antd-config";

const Provider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <React.Suspense>
      <Toaster position="top-right" richColors />
      <AntDConfig>{children}</AntDConfig>
    </React.Suspense>
  );
};
export default Provider;
