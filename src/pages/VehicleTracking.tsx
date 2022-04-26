import Layout from "components/Layout";
import { GoogleMap } from "@react-google-maps/api";
import { useCallback, useMemo, useState } from "react";
import { db } from "firebase-config";
import { useCollection } from "react-firebase-hooks/firestore";
import {
	collection,
	CollectionReference,
	DocumentData,
	QueryDocumentSnapshot,
} from "firebase/firestore";
import { decodeParcelPaths, Parcel } from "./RouteOptimization";
import VehicleComponent from "components/Vehicle";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { Box, Chip, Button, Modal, Typography, LinearProgress } from "@mui/material";
import { convertDocToParcel, columns as parcelColumns } from "./PackageTracking";

export type VehicleStatus = "idle" | "delivery";

export type VehicleStatusColor =
	| "default"
	| "warning"
	| "primary"
	| "secondary"
	| "error"
	| "info"
	| "success"
	| undefined;

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

const StatusColorMap: { [status in VehicleStatus]: VehicleStatusColor } = {
	idle: "warning",
	delivery: "info",
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
const parcelsCollectionRef = collection(db, "parcels") as CollectionReference<Parcel>;

export const convertDocToVehicle = (doc: QueryDocumentSnapshot<DocumentData>): Vehicle => {
	const paths = decodeParcelPaths(doc.data()!.paths as string[]);

	return {
		id: doc.id,
		...doc.data(),
		paths,
	} as Vehicle;
};

interface ColumnsArgs {
	showParcels: (row: Vehicle) => void;
	showPaths: (row: Vehicle) => void;
}

type Columns = (args: ColumnsArgs) => GridColDef<Vehicle>[];

const getColumns: Columns = (args) => {
	const { showParcels, showPaths } = args;

	return [
		{ field: "id", headerName: "ID", width: 200, headerAlign: "center" },
		{
			field: "status",
			headerName: "Status",
			flex: 1,
			headerAlign: "center",
			renderCell: (params: GridValueGetterParams<Vehicle>) => (
				<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
					<Chip
						label={(params.row.status as VehicleStatus).toUpperCase()}
						size='small'
						color={StatusColorMap[params.row.status as VehicleStatus]}
					/>
				</Box>
			),
		},
		{
			field: "deliveryProgress",
			headerName: "Delivery Progress",
			flex: 1,
			headerAlign: "center",
			renderCell: (params: GridValueGetterParams<Vehicle>) => (
				<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
					{params.row.status === "idle" ? (
						"-"
					) : (
						<>
							<Typography>{`${(params.row.deliveryProgress * 100).toFixed(2)}%`}</Typography>
							<Box sx={{ width: "80%", marginTop: "2px" }}>
								<LinearProgress value={params.row.deliveryProgress * 100} variant='determinate' />
							</Box>
						</>
					)}
				</Box>
			),
		},
		{
			field: "parcels",
			headerName: "Parcels",
			sortable: false,
			width: 200,
			renderCell: (params: GridValueGetterParams<Vehicle>) => (
				<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
					<Button
						disabled={params.row.parcels.length === 0}
						size='small'
						variant='outlined'
						onClick={() => showParcels(params.row)}
					>
						Show Parcels
					</Button>
				</Box>
			),
			headerAlign: "center",
		},
		{
			field: "paths",
			headerName: "Paths",
			sortable: false,
			width: 200,
			renderCell: (params: GridValueGetterParams<Vehicle>) => (
				<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
					<Button
						disabled={params.row.parcels.length === 0}
						size='small'
						variant='outlined'
						onClick={() => showPaths(params.row)}
					>
						Show Paths
					</Button>
				</Box>
			),
			headerAlign: "center",
		},
	];
};

const VehicleTracking: React.FC = () => {
	const [parcelsModalOpen, setParcelsModalOpen] = useState(false);
	const [pathsModalOpen, setPathsModalOpen] = useState(false);
	const [vehicle, setVehicle] = useState<Vehicle>();
	const [snapshot, vehiclesLoading] = useCollection(vehiclesCollectionRef);
	const [parcelsSnapshot, parcelsLoading] = useCollection(parcelsCollectionRef);

	const vehicles = useMemo(() => {
		const docs = snapshot?.docs || [];

		return docs.map(convertDocToVehicle);
	}, [snapshot]);

	const handleShowParcels = useCallback((row: Vehicle) => {
		setVehicle(row);
		setParcelsModalOpen(true);
	}, []);

	const handleShowPaths = useCallback((row: Vehicle) => {
		setVehicle(row);
		setPathsModalOpen(true);
	}, []);

	const columns = useMemo(
		() => getColumns({ showParcels: handleShowParcels, showPaths: handleShowPaths }),
		[handleShowParcels, handleShowPaths]
	);

	const parcels = useMemo(() => {
		if (!vehicle) return [];

		const docs = parcelsSnapshot?.docs || [];

		const userParcels = vehicle.parcels.reduce((prev, parcelId) => {
			const parcel = docs.find((doc) => doc.id === parcelId);

			return parcel ? [...prev, convertDocToParcel(parcel)] : prev;
		}, [] as Parcel[]);

		return userParcels;
	}, [parcelsSnapshot, vehicle]);

	return (
		<Layout title='Vehicle Tracking'>
			<Box sx={{ height: "500px", marginBottom: 3 }}>
				<DataGrid
					rows={vehicles}
					columns={columns}
					pageSize={15}
					loading={vehiclesLoading}
					disableSelectionOnClick
					rowsPerPageOptions={[15]}
				/>
			</Box>

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

			<Modal
				open={parcelsModalOpen}
				onClose={() => {
					setParcelsModalOpen(false);
					setVehicle(undefined);
				}}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
				}}
			>
				<Box sx={{ background: "white", width: "80%", paddingX: 3, paddingY: 2, borderRadius: 1 }}>
					<Box sx={{ marginBottom: 2 }}>
						<Typography variant='h5'>{vehicle?.id} - Parcels</Typography>
					</Box>

					<Box sx={{ height: "400px" }}>
						<DataGrid
							rows={parcels}
							columns={parcelColumns}
							pageSize={5}
							rowsPerPageOptions={[5]}
							disableSelectionOnClick
							loading={parcelsLoading}
						/>
					</Box>
				</Box>
			</Modal>

			<Modal
				open={pathsModalOpen}
				onClose={() => {
					setPathsModalOpen(false);
					setVehicle(undefined);
				}}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
				}}
			>
				<Box
					sx={{
						background: "white",
						width: "80%",
						paddingX: 3,
						paddingY: 2,
						borderRadius: 1,
					}}
				>
					<Box sx={{ marginBottom: 2 }}>
						<Typography variant='h5'>{vehicle?.id} - Paths</Typography>
					</Box>

					{vehicle && (
						<GoogleMap
							id='route-optimization-map'
							mapContainerStyle={{ height: "50vh", width: "100%" }}
							center={{
								lat: vehicle.paths[0].lat() || center.lat,
								lng: vehicle.paths[0].lng() || center.lng,
							}}
							zoom={15}
						>
							<VehicleComponent vehicle={vehicle} isPathOnly />
						</GoogleMap>
					)}
				</Box>
			</Modal>
		</Layout>
	);
};

export default VehicleTracking;
