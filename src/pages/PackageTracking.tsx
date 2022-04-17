import Layout from "components/Layout";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "firebase-config";
import {
	collection,
	updateDoc,
	doc,
	DocumentReference,
	addDoc,
	QueryDocumentSnapshot,
	DocumentData,
} from "firebase/firestore";
import { useCallback, useMemo, useState } from "react";
import { DataGrid, GridColDef, GridSelectionModel, GridValueGetterParams } from "@mui/x-data-grid";
import { Parcel, decodeParcelPaths, encodeParcelPaths } from "./RouteOptimization";
import { HiCheck } from "react-icons/hi";
import { Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import { BsDash } from "react-icons/bs";
import toast from "react-hot-toast";
import { Vehicle, VehicleDto } from "./VehicleTracking";

const parcelsCollectionRef = collection(db, "parcels");
const vehiclesCollectionRef = collection(db, "vehicles");

type ParcelStatusColor =
	| "default"
	| "warning"
	| "primary"
	| "secondary"
	| "error"
	| "info"
	| "success"
	| undefined;

export type ParcelStatus = "Inventory" | "In Delivery" | "Delivered";

const StatusMap: { [status in ParcelStatus]: ParcelStatusColor } = {
	Inventory: "primary",
	"In Delivery": "warning",
	Delivered: "success",
};

const columns: GridColDef<Parcel>[] = [
	{ field: "id", headerName: "ID", width: 200, headerAlign: "center" },
	{ field: "origin", headerName: "Origin", flex: 1, headerAlign: "center" },
	{ field: "destination", headerName: "Destination", flex: 1, headerAlign: "center" },
	{ field: "description", headerName: "Description", flex: 1, headerAlign: "center" },
	{
		field: "paths",
		headerName: "Optimal Route",
		sortable: false,
		width: 150,
		renderCell: (params: GridValueGetterParams<Parcel>) => (
			<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
				<Box
					sx={(theme) => ({
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "30px",
						width: "30px",
						backgroundColor:
							params.row.paths.length > 0 ? theme.palette.success.light : theme.palette.error.light,
					})}
				>
					{params.row.paths.length > 0 ? (
						<HiCheck size={20} color='#ffffff' />
					) : (
						<BsDash size={20} color='#ffffff' />
					)}
				</Box>
			</Box>
		),
		headerAlign: "center",
	},
	{
		field: "status",
		headerName: "Status",
		sortable: false,
		width: 100,
		renderCell: (params: GridValueGetterParams<Parcel>) => (
			<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
				<Chip
					label={params.row.status}
					size='small'
					color={StatusMap[params.row.status as ParcelStatus]}
				/>
			</Box>
		),
		headerAlign: "center",
	},
];

const changeParcelsStatus = async (selectionModel: GridSelectionModel, status: ParcelStatus) => {
	return new Promise<void>(async (resolve, reject) => {
		const documentReferences = selectionModel.map((selection) => {
			return doc(db, "parcels", selection as string) as DocumentReference<Parcel>;
		});

		const promises = documentReferences.map((ref) => updateDoc<Parcel>(ref, { status }));

		try {
			await Promise.all(promises);
			return resolve();
		} catch (_error) {
			return reject();
		}
	});
};

const convertDocToParcel = (doc: QueryDocumentSnapshot<DocumentData>): Parcel => {
	return {
		id: doc.id,
		...doc.data(),
		paths: decodeParcelPaths(doc.data().paths),
	} as Parcel;
};

const PackageTracking: React.FC = () => {
	const [inventoryParcelsSelectionModel, setInventoryParcelsSelectionModel] =
		useState<GridSelectionModel>([]);
	const [sendToDeliveryLoading, setSendToDeliveryLoading] = useState(false);
	const [parcelsSnapshot, loading] = useCollection(parcelsCollectionRef);
	const [vehiclesSnapshot, vehiclesLoading] = useCollection(vehiclesCollectionRef);

	const rows = useMemo(() => {
		const docs = parcelsSnapshot?.docs || [];

		return docs.map((doc) => convertDocToParcel(doc));
	}, [parcelsSnapshot]);

	const inventoryRows = useMemo(() => {
		return rows.filter((row) => row.status === "Inventory");
	}, [rows]);

	const inDeliveryRows = useMemo(() => {
		return rows.filter((row) => row.status === "In Delivery");
	}, [rows]);

	const deliveredRows = useMemo(() => {
		return rows.filter((row) => row.status === "Delivered");
	}, [rows]);

	const vehicles = useMemo(() => {
		const docs = vehiclesSnapshot?.docs || [];

		return docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Vehicle[];
	}, [vehiclesSnapshot]);

	const idleVehicles = useMemo(() => {
		return vehicles.filter((vehicle) => vehicle.status === "idle");
	}, [vehicles]);

	const handleInventoryParcelsSelectionModelChange = useCallback(
		async (selectionModel: GridSelectionModel) => {
			setInventoryParcelsSelectionModel(selectionModel);
		},
		[]
	);

	const handleInDeliveryParcelsSelectionModelChange = useCallback(
		(selectionModel: GridSelectionModel) => {},
		[]
	);

	const handleDeliveredParcelsSelectionModelChange = useCallback(
		(selectionModel: GridSelectionModel) => {},
		[]
	);

	const handleSendToDelivery = async () => {
		if (vehiclesLoading) {
			toast("Please wait while we load vehicles...");
			return;
		}

		try {
			setSendToDeliveryLoading(true);

			const paths = inventoryParcelsSelectionModel.reduce((prev, selection) => {
				const parcelPaths = inventoryRows.find((row) => row.id === (selection as string))?.paths;

				if (!parcelPaths) return prev;

				return { ...prev, [selection as string]: encodeParcelPaths(parcelPaths) };
			}, {} as { [parcelId: string]: string[] });

			if (idleVehicles.length === 0) {
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
				const vehicle = idleVehicles[0];
				const vehicleRef = doc(db, "parcels", vehicle.id) as DocumentReference<Vehicle>;

				await updateDoc<Vehicle>(vehicleRef, {
					paths,
					parcels: inventoryParcelsSelectionModel as string[],
					status: "delivery",
					deliveryProgress: 0,
				});

				toast.success(`Parcels added to vehicle ${vehicleRef.id} successfully`, { duration: 5000 });
			}

			await changeParcelsStatus(inventoryParcelsSelectionModel, "In Delivery");

			setInventoryParcelsSelectionModel([]);

			toast.success("Parcels moved to 'In Delivery'", { duration: 5000 });
		} catch (_error) {
			toast.error("Error moving parcels to 'In Delivery'", { duration: 5000 });
		} finally {
			setSendToDeliveryLoading(false);
		}
	};

	return (
		<Layout title='Package Tracking'>
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

				<Box sx={{ height: "400px" }}>
					<DataGrid
						rows={inventoryRows}
						columns={columns}
						pageSize={5}
						rowsPerPageOptions={[5]}
						checkboxSelection
						loading={loading}
						onSelectionModelChange={handleInventoryParcelsSelectionModelChange}
					/>
				</Box>
			</Box>

			<Box sx={{ marginBottom: 5 }}>
				<Typography
					variant='h6'
					sx={{ marginBottom: 1 }}
					color={(theme) => theme.palette.primary.dark}
				>
					In Delivery Parcels
				</Typography>
				<Box sx={{ height: "400px" }}>
					<DataGrid
						rows={inDeliveryRows}
						columns={columns}
						pageSize={5}
						rowsPerPageOptions={[5]}
						checkboxSelection
						loading={loading}
						onSelectionModelChange={handleInDeliveryParcelsSelectionModelChange}
					/>
				</Box>
			</Box>

			<Box sx={{ marginBottom: 5 }}>
				<Typography
					variant='h6'
					sx={{ marginBottom: 1 }}
					color={(theme) => theme.palette.primary.dark}
				>
					Delivered Parcels
				</Typography>
				<Box sx={{ height: "400px" }}>
					<DataGrid
						rows={deliveredRows}
						columns={columns}
						pageSize={5}
						rowsPerPageOptions={[5]}
						checkboxSelection
						loading={loading}
						onSelectionModelChange={handleDeliveredParcelsSelectionModelChange}
					/>
				</Box>
			</Box>
		</Layout>
	);
};

export default PackageTracking;
