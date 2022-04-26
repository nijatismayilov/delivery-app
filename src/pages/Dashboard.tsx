import { Box, Typography } from "@mui/material";
import { indigo, red } from "@mui/material/colors";
import DashboardCard from "components/DashboardCard";
import Layout from "components/Layout";
import { db } from "firebase-config";
import { collection, CollectionReference } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { convertDocToParcel } from "./PackageTracking";
import { Parcel } from "./RouteOptimization";
import { convertDocToUser, User } from "./Users";
import { convertDocToVehicle, Vehicle } from "./VehicleTracking";
import { Pie } from "react-chartjs-2";
import { ChartData } from "chart.js";
import "chart.js/auto";

const usersCollectionRef = collection(db, "users") as CollectionReference<User>;
const parcelsCollectionRef = collection(db, "parcels") as CollectionReference<Parcel>;
const vehiclesCollectionRef = collection(db, "vehicles") as CollectionReference<Vehicle>;

interface UsersData {
	haveParcels: User[];
	haveNoParcels: User[];
}

interface ParcelsData {
	inventory: Parcel[];
	inDelivery: Parcel[];
	delivered: Parcel[];
}

interface VehiclesData {
	idle: Vehicle[];
	inDelivery: Vehicle[];
}

type PieChartData = ChartData<"pie", number[], string>;

const Dashboard: React.FC = () => {
	const [usersSnapshot, usersLoading] = useCollection(usersCollectionRef);
	const [parcelsSnapshot, parcelsLoading] = useCollection(parcelsCollectionRef);
	const [vehiclesSnapshot, vehiclesLoading] = useCollection(vehiclesCollectionRef);

	const usersData = useMemo<UsersData>(() => {
		if (usersSnapshot) {
			const userEntities = usersSnapshot.docs.map(convertDocToUser);
			const haveParcels = userEntities.filter((user) => user.parcels.length > 0);
			const haveNoParcels = userEntities.filter((user) => user.parcels.length === 0);

			return { haveParcels, haveNoParcels };
		}

		return {
			haveParcels: [],
			haveNoParcels: [],
		};
	}, [usersSnapshot]);

	const parcelsData = useMemo<ParcelsData>(() => {
		if (parcelsSnapshot) {
			const parcelEntities = parcelsSnapshot.docs.map(convertDocToParcel);
			const inventory = parcelEntities.filter((parcel) => parcel.status === "Inventory");
			const inDelivery = parcelEntities.filter((parcel) => parcel.status === "In Delivery");
			const delivered = parcelEntities.filter((parcel) => parcel.status === "Delivered");

			return { inventory, inDelivery, delivered };
		}

		return {
			inventory: [],
			inDelivery: [],
			delivered: [],
		};
	}, [parcelsSnapshot]);

	const vehiclesData = useMemo<VehiclesData>(() => {
		if (vehiclesSnapshot) {
			const vehicleEntities = vehiclesSnapshot.docs.map(convertDocToVehicle);
			const idle = vehicleEntities.filter((vehicle) => vehicle.status === "idle");
			const inDelivery = vehicleEntities.filter((vehicle) => vehicle.status === "delivery");

			return { idle, inDelivery };
		}

		return {
			idle: [],
			inDelivery: [],
		};
	}, [vehiclesSnapshot]);

	const usersPieChartData = useMemo<PieChartData>(() => {
		const { haveParcels, haveNoParcels } = usersData;
		const labels = ["Users with Parcels", "Users without Parcels"];
		const datasets: PieChartData["datasets"] = [
			{
				label: "Users",
				data: [haveParcels.length, haveNoParcels.length],
				backgroundColor: [indigo["200"], indigo["400"]],
				hoverOffset: 2,
			},
		];

		return {
			labels,
			datasets,
		};
	}, [usersData]);

	const parcelsPieChartData = useMemo<PieChartData>(() => {
		const { inventory, inDelivery, delivered } = parcelsData;
		const labels = ["Inventory", "In Delivery", "Delivered"];
		const datasets: PieChartData["datasets"] = [
			{
				label: "Parcels",
				data: [inventory.length, inDelivery.length, delivered.length],
				backgroundColor: [indigo["200"], indigo["400"], indigo["600"]],
				hoverOffset: 2,
			},
		];

		return {
			labels,
			datasets,
		};
	}, [parcelsData]);

	const vehiclesPieChartData = useMemo<PieChartData>(() => {
		const { idle, inDelivery } = vehiclesData;
		const labels = ["Idle", "In Delivery"];
		const datasets: PieChartData["datasets"] = [
			{
				label: "Vehicles",
				data: [idle.length, inDelivery.length],
				backgroundColor: [indigo["200"], indigo["400"]],
				hoverOffset: 2,
			},
		];

		return {
			labels,
			datasets,
		};
	}, [vehiclesData]);

	return (
		<Layout title='Dashboard'>
			<Box
				sx={{
					width: "100%",
					padding: 1,
					borderRadius: 2,
					marginBottom: 9,
				}}
			>
				<Typography variant='h3' fontWeight={400} mb={3} color={indigo["900"]}>
					Total Metrics
				</Typography>

				<Box sx={{ display: "flex", margin: -1, flexWrap: "wrap", justifyContent: "center" }}>
					<DashboardCard
						amount={(usersSnapshot?.docs || []).length}
						title='Total Users'
						loading={usersLoading}
					/>
					<DashboardCard
						amount={(parcelsSnapshot?.docs || []).length}
						title='Total Parcels'
						loading={parcelsLoading}
					/>
					<DashboardCard
						amount={(vehiclesSnapshot?.docs || []).length}
						title='Total Vehicles'
						loading={vehiclesLoading}
					/>
				</Box>
			</Box>

			<Box
				sx={{
					width: "100%",
					padding: 1,
					borderRadius: 2,
					marginBottom: 2,
				}}
			>
				<Typography variant='h3' fontWeight={400} mb={3} color={indigo["900"]}>
					Metrics by Categories
				</Typography>

				<Box sx={{ display: "flex", margin: -1, flexWrap: "wrap", justifyContent: "center" }}>
					<Box sx={{ width: "25%", padding: 1 }}>
						<Pie data={usersPieChartData} />
					</Box>

					<Box sx={{ width: "25%", padding: 1 }}>
						<Pie data={parcelsPieChartData} />
					</Box>

					<Box sx={{ width: "25%", padding: 1 }}>
						<Pie data={vehiclesPieChartData} />
					</Box>
				</Box>
			</Box>
		</Layout>
	);
};

export default Dashboard;
