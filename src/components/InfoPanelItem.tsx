import { Box, CircularProgress, Typography } from "@mui/material";

interface Props {
	title?: string | React.ReactNode;
	progress: number;
	seconds: number;
	color?: string;
}

const InfoPanelItem: React.FC<Props> = (props) => {
	const { title, progress, seconds, color = "#26a7ed" } = props;

	return (
		<Box sx={{ marginBottom: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
			<Typography sx={{ marginBottom: 1, color }} variant='h6' align='center'>
				{title}
			</Typography>

			<Box sx={{ position: "relative", height: "60px" }}>
				<CircularProgress
					sx={{
						circle: {
							stroke: color,
						},
					}}
					variant='determinate'
					value={progress}
					size={60}
				/>

				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						fontSize: "1.5rem",
						lineHeight: 1,
						color,
					}}
				>
					{seconds}
				</Box>
			</Box>
		</Box>
	);
};

export default InfoPanelItem;
