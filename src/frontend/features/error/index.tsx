import {
  isRouteErrorResponse,
  Navigate,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { Button } from "antd";
import Section from "@/components/custom/section";
import { AlertOctagonIcon } from "lucide-react";
import { getUserDashboardRoute } from "@/utils/auth";
import paths from "@/config/routes";

const PageError = () => {
  const navigate = useNavigate();
  const to = getUserDashboardRoute();

  const path = window.location.pathname;

  const error = useRouteError();

  let message = "Unknown error";
  let stack = "";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <Navigate
          to={paths.public["404"].redirect(window.location.pathname)}
          replace
        />
      );
    }
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    message = error.message;
    stack = error.stack || "";
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = JSON.stringify(error);
  }

  return (
    <div className="w-dvw h-dvh flex flex-col items-center justify-center bg-slate-950 text-white">
      <p className="text-lg font-medium text-slate-400">Something went wrong</p>

      <pre className="text-destructive px-10 py-2 rounded-lg bg-red-800/20 my-3">
        On page: <span className="font-mono">"{path}"</span>
      </pre>

      <Section
        title={message}
        icon={<AlertOctagonIcon className="text-destructive" />}
        collapsible
        className="min-w-3/5 border-red-500"
        btnClassName="border-b-red-500"
        titleClassName="text-red-500"
      >
        {!!stack && (
          <pre className="px-10 py-2 rounded-lg bg-slate-800/40 text-slate-400 max-w-[90%]. overflow-auto mt-3 text-xs">
            {stack}
          </pre>
        )}
      </Section>

      <Button
        className="px-5 mt-5 bg-slate-900!"
        danger
        onClick={() => {
          window.location.reload();
          navigate(to);
        }}
      >
        Retry
      </Button>
    </div>
  );
};
export default PageError;
