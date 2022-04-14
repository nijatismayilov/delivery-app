import Dashboard from "pages/Dashboard";
import PackageTracking from "pages/PackageTracking";
import RouteOptimization from "pages/RouteOptimization";
import VehicleTrancking from "pages/VehicleTracking";
import {
	DashboardPath,
	PackageTrackingPath,
	RouteOptimizationPath,
	VehicleTrackingPath,
} from "constants/paths";

export type Route = {
	path: string;
	component: React.ReactElement;
};

const DashboardRoute: Route = {
	path: DashboardPath,
	component: <Dashboard />,
};

const PackageTrackingRoute: Route = {
	path: PackageTrackingPath,
	component: <PackageTracking />,
};

const RouteOptimizationRoute: Route = {
	path: RouteOptimizationPath,
	component: <RouteOptimization />,
};

const VehicleTranckingRoute: Route = {
	path: VehicleTrackingPath,
	component: <VehicleTrancking />,
};

export const routes: Route[] = [
	DashboardRoute,
	PackageTrackingRoute,
	RouteOptimizationRoute,
	VehicleTranckingRoute,
];
