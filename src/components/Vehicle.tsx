import { Polyline } from "@react-google-maps/api";
import { Vehicle } from "pages/VehicleTracking";
import { useState, useEffect } from "react";
import { useSpring } from "framer-motion";

const icon = {
	path: 1,
	scale: 6,
	strokeColor: "#ff0000",
	fillColor: "#ff0000",
	rotation: 0,
};

interface Props {
	vehicle: Vehicle;
}

const VehicleComponent: React.FC<Props> = (props) => {
	const { vehicle } = props;
	const [progress, setProgress] = useState(vehicle.deliveryProgress * 100);
	const progressSpring = useSpring(vehicle.deliveryProgress, {
		mass: 8.5,
		damping: 120,
		stiffness: 53,
	});

	useEffect(() => {
		progressSpring.set(vehicle.deliveryProgress);
	}, [progressSpring, vehicle.deliveryProgress]);

	useEffect(
		() =>
			progressSpring.onChange((latest) => {
				setProgress(latest * 100);
			}),
		[progressSpring]
	);

	return (
		<>
			<Polyline
				path={vehicle.paths}
				options={{
					icons: [
						{
							icon,
							offset: `${progress}%`,
						},
					],
					strokeColor: "#3B75C690",
				}}
			/>
		</>
	);
};

export default VehicleComponent;
