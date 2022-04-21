import { Routes, Route } from "react-router-dom";
import { routes } from "app/routes";
import { useLoadScript } from "@react-google-maps/api";
import { Toaster } from "react-hot-toast";

type Library = "places" | "drawing" | "geometry" | "localContext" | "visualization";

const libraries: Library[] = ["places"];

const App: React.FC = () => {
	const { isLoaded } = useLoadScript({
		id: "route-optimization-map",
		googleMapsApiKey: "AIzaSyB3mwDlUpE2G4pMlnPIeJHv4R7kAqmHKsM",
		libraries,
	});

	return (
		<div className='h-screen'>
			{isLoaded ? (
				<Routes>
					{routes.map((route) => (
						<Route key={route.path} path={route.path} element={route.component} />
					))}
				</Routes>
			) : (
				"Loading..."
			)}
			<Toaster />
		</div>
	);
};

export default App;
