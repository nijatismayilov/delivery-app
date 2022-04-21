import Layout from "components/Layout";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "firebase-config";
import {
	collection,
	updateDoc,
	doc,
	DocumentReference,
	QueryDocumentSnapshot,
	DocumentData,
} from "firebase/firestore";
import { useMemo } from "react";
import { DataGrid, GridColDef, GridSelectionModel, GridValueGetterParams } from "@mui/x-data-grid";
import { Parcel, decodeParcelPaths } from "./RouteOptimization";
import { HiCheck } from "react-icons/hi";
import { Box, Chip, Typography } from "@mui/material";
import { BsDash } from "react-icons/bs";
import InventoryParcelsTable from "components/InventoryParcelsTable";

const parcelsCollectionRef = collection(db, "parcels");

export type ParcelStatusColor =
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

export const columns: GridColDef<Parcel>[] = [
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

export const changeParcelsStatus = async (
	selectionModel: GridSelectionModel,
	status: ParcelStatus
) => {
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

export const convertDocToParcel = (doc: QueryDocumentSnapshot<DocumentData>): Parcel => {
	return {
		id: doc.id,
		...doc.data(),
		paths: decodeParcelPaths(doc.data().paths),
	} as Parcel;
};

const PackageTracking: React.FC = () => {
	const [parcelsSnapshot, loading] = useCollection(parcelsCollectionRef);

	const rows = useMemo(() => {
		const docs = parcelsSnapshot?.docs || [];

		return docs.map((doc) => convertDocToParcel(doc));
	}, [parcelsSnapshot]);

	const inDeliveryRows = useMemo(() => {
		return rows.filter((row) => row.status === "In Delivery");
	}, [rows]);

	const deliveredRows = useMemo(() => {
		return rows.filter((row) => row.status === "Delivered");
	}, [rows]);

	return (
		<Layout title='Package Tracking'>
			<InventoryParcelsTable columns={columns} />

			<Box sx={{ marginBottom: 5 }}>
				<Box sx={{ display: "flex", marginBottom: 1, justifyContent: "space-between" }}>
					<Typography variant='h6' color={(theme) => theme.palette.primary.dark}>
						In Delivery Parcels
					</Typography>
				</Box>

				<Box sx={{ height: "400px" }}>
					<DataGrid
						rows={inDeliveryRows}
						columns={columns}
						pageSize={5}
						rowsPerPageOptions={[5]}
						loading={loading}
						disableSelectionOnClick
					/>
				</Box>
			</Box>

			<Box sx={{ marginBottom: 5 }}>
				<Box sx={{ display: "flex", marginBottom: 1, justifyContent: "space-between" }}>
					<Typography variant='h6' color={(theme) => theme.palette.primary.dark}>
						Delivered Parcels
					</Typography>
				</Box>

				<Box sx={{ height: "400px" }}>
					<DataGrid
						rows={deliveredRows}
						columns={columns}
						pageSize={5}
						rowsPerPageOptions={[5]}
						loading={loading}
						disableSelectionOnClick
					/>
				</Box>
			</Box>
		</Layout>
	);
};

export default PackageTracking;
