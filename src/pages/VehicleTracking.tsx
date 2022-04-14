import Layout from "components/Layout";
import { GoogleMap, Polyline } from "@react-google-maps/api";
import { useState, useEffect, useMemo } from "react";
// import { decode } from "@googlemaps/polyline-codec";
import { db } from "firebase-config";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";

const containerStyle = {
	width: "100%",
	height: "calc(100vh * 0.8)",
};

const center = {
	lat: 40.4093,
	lng: 49.8671,
};

const icon = {
	path: 1,
	scale: 6,
	strokeColor: "#ff0000",
	fillColor: "#ff0000",
	rotation: 0,
};

const vehiclesCollectionRef = collection(db, "vehicles");

const VehicleTracking: React.FC = () => {
	const [snapshot] = useCollection(vehiclesCollectionRef, {
		snapshotListenOptions: { includeMetadataChanges: false },
	});
	const docs = useMemo(() => snapshot?.docs || [], [snapshot]);
	const [pathMap, setPathMap] = useState<{
		[id: string]:
			| google.maps.MVCArray<google.maps.LatLng>
			| google.maps.LatLng[]
			| google.maps.LatLngLiteral[];
	}>({});
	const [iconOffset, setIconsOffset] = useState(0);

	useEffect(() => {
		if (docs.length === 0) return;

		const newPathMap = docs.reduce(
			(prevValue, doc) => {
				const data = doc.data();
				const id = doc.id;

				const paths = data.paths.map((path: string) => {
					const [lat, lng] = path.split("-");

					return new google.maps.LatLng(+lat, +lng);
				});

				return { ...prevValue, [id]: paths };
			},
			{} as {
				[id: string]:
					| google.maps.MVCArray<google.maps.LatLng>
					| google.maps.LatLng[]
					| google.maps.LatLngLiteral[];
			}
		);

		setPathMap(newPathMap);

		let interval = setInterval(() => {
			setIconsOffset((prev) => {
				if (prev === 100) {
					clearInterval(interval);
					return 0;
				}

				return prev + 0.005;
			});
		}, 20);

		return () => {
			clearInterval(interval);
		};
	}, [docs]);

	return (
		<Layout title='Vehicle Tracking'>
			<GoogleMap
				id='route-optimization-map'
				mapContainerStyle={containerStyle}
				center={center}
				zoom={13}
			>
				{Object.entries(pathMap).map(([id, path]) => {
					return (
						<Polyline
							key={id}
							path={path}
							options={{
								icons: [
									{
										icon,
										offset: `${iconOffset}%`,
									},
								],
								strokeColor: "#00000000",
							}}
						/>
					);
				})}
			</GoogleMap>
		</Layout>
	);
};

export default VehicleTracking;
