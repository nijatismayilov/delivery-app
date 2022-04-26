import { Box, Typography } from "@mui/material";
import { indigo } from "@mui/material/colors";
import DashboardCard from "components/DashboardCard";
import Layout from "components/Layout";
import { db } from "firebase-config";
import { collection, CollectionReference } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { convertDocToParcel } from "./PackageTracking";
import { Parcel } from "./RouteOptimization";
import { convertDocToUser, User } from "./Users";
import { Vehicle } from "./VehicleTracking";

const usersCollectionRef = collection(db, "users") as CollectionReference<User>;
const parcelsCollectionRef = collection(db, "parcels") as CollectionReference<Parcel>;
const vehiclesCollectionRef = collection(db, "vehicles") as CollectionReference<Vehicle>;

const Dashboard: React.FC = () => {
	const [usersSnapshot, usersLoading] = useCollection(usersCollectionRef);
	const [parcelsSnapshot, parcelsLoading] = useCollection(parcelsCollectionRef);
	const [vehiclesSnapshot, vehiclesLoading] = useCollection(vehiclesCollectionRef);

	// const users = useMemo(() => {
	// 	const docs = snapshot?.docs || [];

	// 	return docs.map(convertDocToUser);
	// }, [snapshot]);

	// const parcels = useMemo(() => {
	// 	if (!user) return [];

	// 	const docs = parcelsSnapshot?.docs || [];

	// 	const userParcels = user.parcels.reduce((prev, parcelId) => {
	// 		const parcel = docs.find((doc) => doc.id === parcelId);

	// 		return parcel ? [...prev, convertDocToParcel(parcel)] : prev;
	// 	}, [] as Parcel[]);

	// 	return userParcels;
	// }, [parcelsSnapshot, user]);

	return (
		<Layout title='Dashboard'>
			<Box
				sx={{
					width: "100%",
					padding: 1,
					borderRadius: 2,
					marginBottom: 2,
				}}
			>
				<Typography variant='h3' fontWeight={400} mb={2} color={indigo["900"]}>
					Total Counts
				</Typography>

				<Box sx={{ display: "flex", margin: -1, flexWrap: "wrap" }}>
					<DashboardCard
						amount={(usersSnapshot?.docs || []).length}
						title='Active Users'
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
		</Layout>
	);
};

export default Dashboard;
