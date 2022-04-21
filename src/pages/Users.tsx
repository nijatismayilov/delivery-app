import Layout from "components/Layout";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "firebase-config";
import {
	collection,
	CollectionReference,
	QueryDocumentSnapshot,
	DocumentData,
} from "firebase/firestore";
import { Box, Button, Modal, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { columns as parcelColumns, convertDocToParcel } from "./PackageTracking";
import { Parcel } from "./RouteOptimization";

export type User = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	parcels: string[];
};

const usersCollectionRef = collection(db, "users") as CollectionReference<User>;
const parcelsCollectionRef = collection(db, "parcels") as CollectionReference<Parcel>;

type Columns = (clickHandler: (row: User) => void) => GridColDef<User>[];
const columns: Columns = (clickHandler) => [
	{ field: "id", headerName: "ID", width: 200, headerAlign: "center" },
	{ field: "firstName", headerName: "First name", flex: 1, headerAlign: "center" },
	{ field: "lastName", headerName: "Last name", flex: 1, headerAlign: "center" },
	{ field: "email", headerName: "Email", flex: 1, headerAlign: "center" },
	{ field: "phoneNumber", headerName: "Phone number", flex: 1, headerAlign: "center" },

	{
		field: "parcels",
		headerName: "Parcels",
		sortable: false,
		width: 200,
		renderCell: (params: GridValueGetterParams<User>) => (
			<Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
				<Button
					disabled={params.row.parcels.length === 0}
					size='small'
					variant='outlined'
					onClick={() => clickHandler(params.row)}
				>
					Show Parcels
				</Button>
			</Box>
		),
		headerAlign: "center",
	},
];

const convertDocToUser = (doc: QueryDocumentSnapshot<DocumentData>): User => {
	return {
		id: doc.id,
		...doc.data(),
	} as User;
};

const Users: React.FC = () => {
	const [modalOpen, setModalOpen] = useState(false);
	const [user, setUser] = useState<User>();
	const [snapshot, usersLoading] = useCollection(usersCollectionRef);
	const [parcelsSnapshot, parcelsLoading] = useCollection(parcelsCollectionRef);

	const users = useMemo(() => {
		const docs = snapshot?.docs || [];

		return docs.map(convertDocToUser);
	}, [snapshot]);

	const parcels = useMemo(() => {
		if (!user) return [];

		const docs = parcelsSnapshot?.docs || [];

		const userParcels = user.parcels.reduce((prev, parcelId) => {
			const parcel = docs.find((doc) => doc.id === parcelId);

			return parcel ? [...prev, convertDocToParcel(parcel)] : prev;
		}, [] as Parcel[]);

		return userParcels;
	}, [parcelsSnapshot, user]);

	const handleRowClick = useCallback((user: User) => {
		setModalOpen(true);
		setUser(user);
	}, []);

	return (
		<Layout title='Users'>
			<Box sx={{ height: "80vh" }}>
				<DataGrid
					rows={users}
					columns={columns(handleRowClick)}
					pageSize={50}
					loading={usersLoading}
					disableSelectionOnClick
					rowsPerPageOptions={[50]}
				/>

				<Modal
					open={modalOpen}
					onClose={() => {
						setModalOpen(false);
						setUser(undefined);
					}}
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
					}}
				>
					<Box
						sx={{ background: "white", width: "80%", paddingX: 3, paddingY: 2, borderRadius: 1 }}
					>
						<Box sx={{ marginBottom: 2 }}>
							<Typography variant='h5'>
								{user?.firstName} {user?.lastName}
							</Typography>
							<Typography variant='subtitle1'>{user?.id}</Typography>
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
			</Box>
		</Layout>
	);
};

export default Users;
