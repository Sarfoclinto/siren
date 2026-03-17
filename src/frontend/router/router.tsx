import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Home = lazy(() => import("@frontend/features/home/page"));
const Login = lazy(() => import("@frontend/features/auth/ui/login"));

const routes: RouteObject[] = [
    {
        
    }
]