import Layout from "components/Layout";
import { GoogleMap } from "@react-google-maps/api";
import { useMemo } from "react";
import { db } from "firebase-config";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, DocumentData, QueryDocumentSnapshot, query, where } from "firebase/firestore";
import { decodeParcelPaths } from "./RouteOptimization";
import VehicleComponent from "components/Vehicle";

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
const getDeliveryVehicles = query(vehiclesCollectionRef, where("status", "==", "delivery"));

const convertDocToVehicle = (doc: QueryDocumentSnapshot<DocumentData>): Vehicle => {
	const paths = decodeParcelPaths(doc.data()!.paths as string[]);

	return {
		id: doc.id,
		...doc.data(),
		paths,
	} as Vehicle;
};

const VehicleTracking: React.FC = () => {
	const [snapshot] = useCollection(getDeliveryVehicles);

	const vehicles = useMemo(() => {
		const docs = snapshot?.docs || [];

		return docs.map(convertDocToVehicle);
	}, [snapshot]);

	return (
		<Layout title='Vehicle Tracking'>
			<GoogleMap
				id='route-optimization-map'
				mapContainerStyle={containerStyle}
				center={center}
				zoom={13}
			>
				{vehicles.map((vehicle) => (
					<VehicleComponent key={vehicle.id} vehicle={vehicle} />
				))}
			</GoogleMap>
		</Layout>
	);
};

export default VehicleTracking;
