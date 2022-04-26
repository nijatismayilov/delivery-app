import { Box, Typography, CircularProgress } from "@mui/material";
import { indigo } from "@mui/material/colors";
import Counter from "components/Counter";

interface Props {
	amount: number;
	title: string;
	loading?: boolean;
}

const DashboardCard: React.FC<Props> = (props) => {
	const { amount, title, loading = false } = props;

	return (
		<Box sx={{ width: "25%", padding: 1 }}>
			<Box
				sx={(theme) => ({
					background: indigo["50"],
					paddingY: 2,
					paddingX: 3,
					borderRadius: 3,
				})}
			>
				<Typography variant='subtitle1' color={indigo["400"]}>
					{title}
				</Typography>
				<Typography variant='h2' fontWeight={400} mt={1} color={indigo["700"]}>
					{loading ? (
						<CircularProgress />
					) : (
						<Counter value={amount} fixedPoint={0} duration={0.7} />
					)}
				</Typography>
			</Box>
		</Box>
	);
};

export default DashboardCard;
