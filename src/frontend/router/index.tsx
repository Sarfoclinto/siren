import Layout from "@frontend/components/layout";
import { isDev } from "@frontend/config/constants";
import PageError from "@frontend/features/error";
import { lazy } from "react";
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";

const Home = lazy(() => import("@frontend/features/home/page"));
const Login = lazy(() => import("@frontend/features/auth/ui/login"));
const Dashboard = lazy(() => import("@frontend/features/dashboard/page"));
const Settings = lazy(() => import("@frontend/features/settings/page"));
const Sounds = lazy(() => import("@frontend/features/sounds/index"));

const routes: RouteObject[] = [
  {
    errorElement: <PageError />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        element: <Layout />,
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/settings",
            element: <Settings />,
          },
          {
            path: "/sounds",
            element: <Sounds />,
          },
        ],
      },
    ],
  },
];

const routerFn = isDev ? createBrowserRouter : createHashRouter;

const router = routerFn(routes);

export const Router = () => {
  return <RouterProvider router={router} />;
};
