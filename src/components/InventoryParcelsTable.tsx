import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "firebase-config";
import {
	collection,
	updateDoc,
	doc,
	DocumentReference,
	addDoc,
	query,
	where,
} from "firebase/firestore";
import { useCallback, useMemo, useState } from "react";
import { DataGrid, GridColDef, GridSelectionModel } from "@mui/x-data-grid";
import { Parcel, getPathsFromDirectionResult } from "pages/RouteOptimization";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { Vehicle, VehicleDto } from "pages/VehicleTracking";
import { changeParcelsStatus, convertDocToParcel } from "pages/PackageTracking";

const parcelsCollectionRef = collection(db, "parcels");
const vehiclesCollectionRef = collection(db, "vehicles");
const countsCollectionRef = collection(db, "total-counts");

const getIdleVehiclesQuery = query(vehiclesCollectionRef, where("status", "==", "idle"));
const getInventoryParcelsQuery = query(parcelsCollectionRef);

interface Props {
	columns: GridColDef<Parcel>[];
}

const InventoryParcelsTable: React.FC<Props> = (props) => {
	const { columns } = props;
	const [sendToDeliveryLoading, setSendToDeliveryLoading] = useState(false);
	const [inventoryParcelsSelectionModel, setInventoryParcelsSelectionModel] =
		useState<GridSelectionModel>([]);
	const [countsSnapshot] = useCollection(countsCollectionRef);
	const [parcelsSnapshot, parcelsLoading] = useCollection(getInventoryParcelsQuery);
	const [idleVehiclesSnapshot, idleVehiclesLoading] = useCollection(getIdleVehiclesQuery);

	const parcelsDocs = useMemo(() => {
		if (parcelsLoading || !parcelsSnapshot) {
			return [];
		}

		return parcelsSnapshot.docs.map(convertDocToParcel);
	}, [parcelsLoading, parcelsSnapshot]);

	const idleVehiclesDocs = useMemo(() => {
		if (idleVehiclesLoading || !idleVehiclesSnapshot) {
			return [];
		}

		return idleVehiclesSnapshot.docs.map(
			(vehicle) => ({ ...vehicle.data(), id: vehicle.id } as Vehicle)
		);
	}, [idleVehiclesLoading, idleVehiclesSnapshot]);

	const handleInventoryParcelsSelectionModelChange = useCallback(
		async (selectionModel: GridSelectionModel) => {
			setInventoryParcelsSelectionModel(selectionModel);
		},
		[]
	);

	const handleSendToDelivery = async () => {
		if (idleVehiclesLoading) {
			toast("Please wait while we load vehicles...");
			return;
		}

		try {
			setSendToDeliveryLoading(true);

			let waypoints: google.maps.DirectionsWaypoint[] | undefined = undefined;
			let origin: string = "";
			let destination: string = "";

			if (inventoryParcelsSelectionModel.length !== 1) {
				const waypointsTuples = inventoryParcelsSelectionModel.map((selection, index) => {
					const parcel = parcelsDocs.find((row) => row.id === (selection as string));

					if (!parcel) return [];

					if (index === 0) {
						origin = parcel.origin;
						return [{ location: parcel.destination, stopover: true }];
					}

					if (index === inventoryParcelsSelectionModel.length - 1) {
						destination = parcel.destination;
						return [{ location: parcel.origin, stopover: true }];
					}

					return [
						{ location: parcel.origin, stopover: true },
						{ location: parcel.destination, stopover: true },
					];
				});

				waypoints = waypointsTuples.reduce((prev, waypointsTuple) => {
					return [...prev, ...waypointsTuple];
				}, [] as google.maps.DirectionsWaypoint[]);
			} else {
				const parcel = parcelsDocs.find(
					(row) => row.id === (inventoryParcelsSelectionModel[0] as string)
				);

				if (!parcel) return;

				origin = parcel.origin;
				destination = parcel.destination;
			}

			const DirectionsService = new google.maps.DirectionsService();

			const result = await DirectionsService.route({
				origin,
				destination,
				travelMode: "DRIVING" as google.maps.TravelMode.DRIVING,
				waypoints,
			});

			if (result) {
				const paths = getPathsFromDirectionResult(result);

				if (!paths) {
					toast.error("Error encoding optimal route for vehicle");
					return;
				}

				console.log(paths);

				if (idleVehiclesDocs.length === 0) {
					const vehicle: VehicleDto = {
						parcels: inventoryParcelsSelectionModel as string[],
						paths,
						status: "delivery",
						deliveryProgress: 0,
					};

					const vehicleRef = await addDoc(vehiclesCollectionRef, vehicle);

					toast.success(`Parcels added to new vehicle ${vehicleRef.id} successfully`, {
						duration: 5000,
					});
				} else {
					const vehicle = idleVehiclesDocs[0];
					const vehicleRef = doc(db, "vehicles", vehicle.id) as DocumentReference<Vehicle>;

					await updateDoc<Vehicle>(vehicleRef, {
						paths,
						parcels: inventoryParcelsSelectionModel as string[],
						status: "delivery",
						deliveryProgress: 0,
					});

					toast.success(`Parcels added to vehicle ${vehicleRef.id} successfully`, {
						duration: 5000,
					});
				}

				await changeParcelsStatus(inventoryParcelsSelectionModel, "In Delivery");

				setInventoryParcelsSelectionModel([]);

				toast.success("Parcels moved to 'In Delivery'", { duration: 5000 });
			} else {
				toast.error(`Error generating optimal route for vehicle`);
			}
		} catch (_error) {
			toast.error("Error moving parcels to 'In Delivery'", { duration: 5000 });
		} finally {
			setSendToDeliveryLoading(false);
		}
	};

	return (
		<Box sx={{ marginBottom: 5 }}>
			<Box sx={{ display: "flex", marginBottom: 1, justifyContent: "space-between" }}>
				<Typography variant='h6' color={(theme) => theme.palette.primary.dark}>
					Inventory Parcels
				</Typography>

				<Button
					disabled={inventoryParcelsSelectionModel.length === 0 || sendToDeliveryLoading}
					variant='contained'
					onClick={handleSendToDelivery}
				>
					{sendToDeliveryLoading ? <CircularProgress size={25} /> : "Send to delivery"}
				</Button>
			</Box>

			{/* <Box sx={{ height: "400px" }}> */}
			<DataGrid
				autoHeight
				rows={parcelsDocs}
				columns={columns}
				pageSize={10}
				rowsPerPageOptions={[10]}
				checkboxSelection
				loading={parcelsLoading}
				onSelectionModelChange={handleInventoryParcelsSelectionModelChange}
			/>
			{/* </Box> */}
		</Box>
	);
};

export default InventoryParcelsTable;
