import Layout from "components/Layout";
import { GoogleMap } from "@react-google-maps/api";
import { useState, useMemo } from "react";
import { db } from "firebase-config";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { decodeParcelPaths } from "./RouteOptimization";
import VehicleComponent from "components/Vehicle";
import { ToggleButtonGroup, ToggleButton, Box } from "@mui/material";

export type VehicleStatus = "idle" | "delivery";

export type Vehicle = {
	id: string;
	parcels: string[];
	status: VehicleStatus;
	deliveryProgress: number;
	paths: google.maps.LatLng[];
};

export type VehicleDto = Omit<Vehicle, "id" | "paths"> & {
	paths: string[];
};

const containerStyle = {
	width: "100%",
	height: "calc(100vh * 0.8)",
};

const center = {
	lat: 40.4093,
	lng: 49.8671,
};

const vehiclesCollectionRef = collection(db, "vehicles");

const convertDocToVehicle = (doc: QueryDocumentSnapshot<DocumentData>): Vehicle => {
	const paths = decodeParcelPaths(doc.data()!.paths as string[]);

	return {
		id: doc.id,
		...doc.data(),
		paths,
	} as Vehicle;
};

const simulationSpeeds = [
	{ label: "Real Time", value: 1 },
	{ label: "5x", value: 5 },
	{ label: "10x", value: 10 },
];

const VehicleTracking: React.FC = () => {
	const [simulationSpeed, setSimulationSpeed] = useState(simulationSpeeds[0].value);
	const [snapshot] = useCollection(vehiclesCollectionRef);

	const vehicles = useMemo(() => {
		const docs = snapshot?.docs || [];

		return docs.map(convertDocToVehicle).filter((v) => v.status === "delivery");
	}, [snapshot]);

	const handleSimulationSpeedChange = (
		_: React.MouseEvent<HTMLElement>,
		newSimulationSpeed: number
	) => {
		setSimulationSpeed(newSimulationSpeed);
	};

	return (
		<Layout title='Vehicle Tracking'>
			<Box sx={{ marginBottom: "15px", display: "flex", justifyContent: "flex-end" }}>
				<ToggleButtonGroup
					size='small'
					value={simulationSpeed}
					exclusive
					onChange={handleSimulationSpeedChange}
				>
					{simulationSpeeds.map(({ value, label }) => (
						<ToggleButton key={value} value={value}>
							{label}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			</Box>

			<GoogleMap
				id='route-optimization-map'
				mapContainerStyle={containerStyle}
				center={center}
				zoom={13}
			>
				{vehicles.map((vehicle) => (
					<VehicleComponent
						key={vehicle.id}
						vehicle={vehicle}
						id={vehicle.id}
						simulationSpeed={simulationSpeed}
					/>
				))}
			</GoogleMap>
		</Layout>
	);
};

export default VehicleTracking;
