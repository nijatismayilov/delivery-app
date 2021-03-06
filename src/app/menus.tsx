import { MdDashboard } from "react-icons/md";
import { FaRoute } from "react-icons/fa";
import { GoPackage } from "react-icons/go";
import { HiTruck, HiUsers } from "react-icons/hi";
import {
	RouteOptimizationPath,
	DashboardPath,
	PackageTrackingPath,
	VehicleTrackingPath,
	UsersPath,
} from "constants/paths";

export type Menu = {
	path: string;
	label: string;
	icon: React.ReactElement;
};

const Dashboard: Menu = {
	path: DashboardPath,
	label: "Dashboard",
	icon: <MdDashboard />,
};

const RouteOptimization: Menu = {
	path: RouteOptimizationPath,
	label: "Route Optimization",
	icon: <FaRoute />,
};

const PackageTracking: Menu = {
	path: PackageTrackingPath,
	label: "Package Tracking",
	icon: <GoPackage />,
};

const VehicleTracking: Menu = {
	path: VehicleTrackingPath,
	label: "Vehicle Tracking",
	icon: <HiTruck />,
};

const Users: Menu = {
	path: UsersPath,
	label: "Users",
	icon: <HiUsers />,
};

export const menus: Menu[] = [
	Dashboard,
	RouteOptimization,
	PackageTracking,
	VehicleTracking,
	Users,
];
