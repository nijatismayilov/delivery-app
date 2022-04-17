import { Polyline } from "@react-google-maps/api";
import { Vehicle } from "pages/VehicleTracking";
import { useState, useMemo, useEffect } from "react";
import { db } from "firebase-config";
import { updateDoc, doc, getDoc, DocumentReference } from "firebase/firestore";
import { Parcel } from "pages/RouteOptimization";

const icon = {
	path: 1,
	scale: 6,
	strokeColor: "#ff0000",
	fillColor: "#ff0000",
	rotation: 0,
};

const updateVehicleProgress = async (id: string, progress: number) => {
	const vehicleRef = doc(db, "vehicles", id);

	await updateDoc(vehicleRef, { deliveryProgress: progress });
};

const setVehicleIdle = async (id: string) => {
	const vehicleRef = doc(db, "vehicles", id);
	const vehicleSnapshot = await getDoc(vehicleRef);
	const vehicle = vehicleSnapshot.data() as Vehicle | undefined;

	if (vehicle) {
		const parcelRefs = vehicle.parcels.map((parcelId) =>
			doc(db, "parcels", parcelId)
		) as DocumentReference<Parcel>[];

		await Promise.all(
			parcelRefs.map((parcelRef) => updateDoc<Parcel>(parcelRef, { status: "Delivered" }))
		);
	}

	await updateDoc(vehicleRef, { status: "idle", deliveryProgress: 0, parcels: [], paths: {} });
};

interface Props {
	vehicle: Vehicle;
	id: string;
	simulationSpeed: number;
}

const VehicleComponent: React.FC<Props> = (props) => {
	const { vehicle, id, simulationSpeed } = props;
	const [progress, setProgress] = useState(vehicle.deliveryProgress * 100);

	const path = useMemo(() => {
		return vehicle.parcels.reduce((prev, parcel) => {
			return [...prev, ...vehicle.paths[parcel]];
		}, [] as google.maps.LatLng[]);
	}, [vehicle]);

	useEffect(() => {
		let interval = setInterval(async () => {
			setProgress((prevProgress) => {
				if (prevProgress >= 100) {
					clearInterval(interval);
				}

				return prevProgress + 0.1 * simulationSpeed;
			});
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, [simulationSpeed]);

	useEffect(() => {
		(async () => {
			if (progress >= 100) {
				await setVehicleIdle(id);
				return;
			}

			await updateVehicleProgress(id, progress / 100);
		})();
	}, [progress, id]);

	return (
		<>
			<Polyline
				path={path}
				options={{
					icons: [
						{
							icon,
							offset: `${progress}%`,
						},
					],
					strokeColor: "#000000",
				}}
			/>
		</>
	);
};

export default VehicleComponent;
