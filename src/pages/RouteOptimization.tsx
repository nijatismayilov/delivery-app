import { useState, useCallback, memo, useMemo, useRef } from "react";
import Layout from "components/Layout";
import {
	GoogleMap,
	DirectionsRenderer,
	DirectionsService,
	Autocomplete,
} from "@react-google-maps/api";
import { decode } from "@googlemaps/polyline-codec";
import { db } from "firebase-config";
import { collection, addDoc, updateDoc, DocumentReference, DocumentData } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import {
	Box,
	Button,
	Modal,
	TextField,
	Typography,
	CircularProgress,
	Select,
	MenuItem,
	SelectChangeEvent,
} from "@mui/material";
import { HiPlusSm } from "react-icons/hi";
import toast from "react-hot-toast";
import { ParcelStatus } from "./PackageTracking";
import { convertDocToUser } from "./Users";

const containerStyle = {
	width: "100%",
	height: "calc(100vh * 0.8)",
};

const center = {
	lat: 40.4093,
	lng: 49.8671,
};

const MemoizedDirectionsService = memo(DirectionsService);

const parcelsCollectionRef = collection(db, "parcels");
const usersCollectionRef = collection(db, "users");

export const getPathsFromDirectionResult = (result: google.maps.DirectionsResult) => {
	const { routes } = result;

	if (!routes[0]) return;

	const { legs } = routes[0];

	const coordsTuples = legs.map((leg) => {
		const { steps } = leg;

		const paths = steps.reduce((prevValue, step) => {
			// @ts-ignore
			const decodedPath = decode(step!.polyline.points, 5);
			const path = decodedPath.map((coords) => new google.maps.LatLng(coords[0], coords[1]));

			return [...prevValue, ...path];
		}, [] as google.maps.LatLng[]);

		return paths;
	});

	const paths = coordsTuples.reduce((prevValue, coords) => {
		return [...prevValue, ...coords];
	}, [] as google.maps.LatLng[]);

	const pathsEncoded = paths.map((path) => [path.lat(), path.lng()].join("-"));

	return pathsEncoded;
};

export const decodeParcelPaths = (paths: string[]): google.maps.LatLng[] => {
	return paths.map((path) => {
		const [lat, lng] = path.split("-");

		return new google.maps.LatLng(+lat, +lng);
	});
};

export const encodeParcelPaths = (paths: google.maps.LatLng[]): string[] => {
	return paths.map((path) => [path.lat(), path.lng()].join("-"));
};

export type Parcel = {
	id: string;
	origin: string;
	destination: string;
	description: string;
	paths?: google.maps.LatLng[];
	status?: ParcelStatus;
	userId: string;
};

export type ParcelDto = Omit<Parcel, "id">;

const addParcelToFirebase = async (parcel: ParcelDto) => {
	try {
		const ref = await addDoc(parcelsCollectionRef, parcel);
		toast.success(`Parcel Added - ${ref.id}`);

		return ref;
	} catch (_error) {}
};

const RouteOptimization: React.FC = () => {
	const [directions, setDirections] = useState<google.maps.DirectionsResult>();
	const [originAutocomplete, setOriginAutocomplete] = useState<google.maps.places.Autocomplete>();
	const [destinationAutocomplete, setDestinationAutocomplete] =
		useState<google.maps.places.Autocomplete>();
	const [modalOpen, setModalOpen] = useState(false);
	const [addParcelLoading, setAddParcelLoading] = useState(false);
	const [getOptimalRouteLoading, setGetOptimalRouteLoading] = useState(false);
	const [parcelOrigin, setParcelOrigin] = useState<string>();
	const [parcelDestination, setParcelDestination] = useState<string>();
	const [parcelDescription, setParcelDescription] = useState<string>();
	const [directionOptions, setDirectionsOptions] = useState<google.maps.DirectionsRequest>();
	const [parcelRef, setParcelRef] = useState<DocumentReference<DocumentData>>();
	const [user, setUser] = useState<string>();
	const [usersSnapshot, usersLoading] = useCollection(usersCollectionRef);

	const users = useMemo(() => {
		if (!usersSnapshot) return [];

		return usersSnapshot.docs.map(convertDocToUser);
	}, [usersSnapshot]);

	const handleDirectionsServiceCallback = useCallback(
		async (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
			if (!result || status !== "OK") {
				setDirections(undefined);
				return;
			}

			setDirections(result);
			setGetOptimalRouteLoading(false);
			setDirectionsOptions(undefined);

			const paths = getPathsFromDirectionResult(result);

			if (!paths) {
				toast.error("Something went wrong while getting optimal route");
				return;
			}

			if (!parcelRef) {
				toast.error("Something went wrong while getting parcel ref");
				return;
			}

			try {
				await updateDoc(parcelRef, { paths });
				toast.success("Optimal Route Updated");
				setParcelRef(undefined);
			} catch (_error) {}
		},
		[parcelRef]
	);

	const handleOriginAutocompleteLoad = useCallback(
		(autocomplete: google.maps.places.Autocomplete) => {
			setOriginAutocomplete(autocomplete);
		},
		[]
	);

	const handleOriginAutocompletePlaceChanged = useCallback(() => {
		if (!originAutocomplete) return;

		const place = originAutocomplete.getPlace();

		setParcelOrigin(place.formatted_address);
	}, [originAutocomplete]);

	const handleDestinationAutocompleteLoad = useCallback(
		(autocomplete: google.maps.places.Autocomplete) => {
			setDestinationAutocomplete(autocomplete);
		},
		[]
	);

	const handleDestinationAutocompletePlaceChanged = useCallback(() => {
		if (!destinationAutocomplete) return;

		const place = destinationAutocomplete.getPlace();

		setParcelDestination(place.formatted_address);
	}, [destinationAutocomplete]);

	const handleAddParcel = async () => {
		setAddParcelLoading(true);

		try {
			if (!parcelOrigin || !parcelDestination || !parcelDescription || !user) {
				toast.error("Required fields must be filled");
				return;
			}

			const parcel: ParcelDto = {
				origin: parcelOrigin,
				destination: parcelDestination,
				description: parcelDescription,
				status: "Inventory",
				userId: user,
			};

			const ref = await addParcelToFirebase(parcel);

			if (!ref) {
				toast.error("Something went wrong, please try again");

				return;
			}

			const userSnapshot = usersSnapshot?.docs.find((user) => user.id === parcel.userId);

			if (!userSnapshot) return;

			const userRef = userSnapshot.ref;

			await updateDoc(userRef, { parcels: [...userSnapshot.data().parcels, ref.id] });
			toast.success("Parcel Added");
			setParcelOrigin("");
			setParcelDestination("");
			setParcelDescription("");
			setModalOpen(false);

			setParcelRef(ref);
			setParcelOrigin(undefined);
			setParcelDestination(undefined);
			setParcelDescription(undefined);
			setModalOpen(false);

			await handleGetOptimalRoute({ origin: parcel.origin, destination: parcel.destination });
		} catch (error) {
			toast.error("Something went wrong, please try again");
		} finally {
			setAddParcelLoading(false);
		}
	};

	const handleGetOptimalRoute = async (args: { origin: string; destination: string }) => {
		const { origin, destination } = args;

		setGetOptimalRouteLoading(true);
		setDirections(undefined);

		setTimeout(() => {
			setDirectionsOptions({
				origin,
				destination,
				travelMode: "DRIVING" as google.maps.TravelMode.DRIVING,
			});
		}, 10000);
	};

	const handleChange = (event: SelectChangeEvent) => {
		setUser(event.target.value as string);
	};

	return (
		<Layout title='Route Optimization'>
			<Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
				<Button startIcon={<HiPlusSm />} variant='contained' onClick={() => setModalOpen(true)}>
					Add Parcel
				</Button>
			</Box>

			<Modal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
				}}
			>
				<Box sx={{ background: "white", width: "40%", paddingX: 3, paddingY: 2, borderRadius: 1 }}>
					<Typography variant='subtitle1' sx={{ fontSize: 20, marginBottom: 2 }}>
						Add new Parcel
					</Typography>

					<Autocomplete
						onLoad={handleOriginAutocompleteLoad}
						onPlaceChanged={handleOriginAutocompletePlaceChanged}
					>
						<TextField
							type='text'
							placeholder='Select an origin'
							variant='outlined'
							sx={{
								width: `100%`,
								marginBottom: 5,
							}}
						/>
					</Autocomplete>

					<Autocomplete
						onLoad={handleDestinationAutocompleteLoad}
						onPlaceChanged={handleDestinationAutocompletePlaceChanged}
					>
						<TextField
							type='text'
							placeholder='Select a destination'
							variant='outlined'
							sx={{
								width: `100%`,
								marginBottom: 5,
							}}
						/>
					</Autocomplete>

					<TextField
						type='text'
						placeholder='Parcel description'
						minRows={3}
						multiline
						fullWidth
						sx={{
							marginBottom: 5,
						}}
						value={parcelDescription}
						onChange={(e) => setParcelDescription(e.target.value)}
					/>

					<Select value={user} onChange={handleChange} fullWidth sx={{ marginBottom: 5 }}>
						<MenuItem disabled value=''>
							User
						</MenuItem>
						{users.map((user) => (
							<MenuItem key={user.id} value={user.id}>
								{user.firstName} {user.lastName}
							</MenuItem>
						))}
					</Select>

					<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
						<Button disabled={addParcelLoading} variant='contained' onClick={handleAddParcel}>
							{addParcelLoading ? <CircularProgress size={25} /> : "Add"}
						</Button>
					</Box>
				</Box>
			</Modal>

			<Box sx={{ position: "relative" }}>
				{getOptimalRouteLoading && (
					<Box
						sx={{
							position: "absolute",
							height: "100%",
							width: "100%",
							backgroundColor: "#ffffff80",
							zIndex: 5,
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<Box
							sx={(theme) => ({ background: theme.palette.grey[300], display: "flex", padding: 2 })}
						>
							<CircularProgress />
							<Typography variant='h4' color={(theme) => theme.palette.primary.main}>
								Getting Optimal Route...
							</Typography>
						</Box>
					</Box>
				)}

				<GoogleMap
					id='route-optimization-map'
					mapContainerStyle={containerStyle}
					center={center}
					zoom={13}
				>
					{directionOptions && (
						<MemoizedDirectionsService
							options={directionOptions}
							callback={handleDirectionsServiceCallback}
						/>
					)}

					{directions && <DirectionsRenderer directions={directions} />}
				</GoogleMap>
			</Box>
		</Layout>
	);
};

export default RouteOptimization;
