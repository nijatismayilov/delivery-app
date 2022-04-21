import Dashboard from "pages/Dashboard";
import PackageTracking from "pages/PackageTracking";
import RouteOptimization from "pages/RouteOptimization";
import VehicleTrancking from "pages/VehicleTracking";
import Users from "pages/Users";
import {
	DashboardPath,
	PackageTrackingPath,
	RouteOptimizationPath,
	VehicleTrackingPath,
	UsersPath,
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

const UsersRoute: Route = {
	path: UsersPath,
	component: <Users />,
};

export const routes: Route[] = [
	DashboardRoute,
	PackageTrackingRoute,
	RouteOptimizationRoute,
	VehicleTranckingRoute,
	UsersRoute,
];
