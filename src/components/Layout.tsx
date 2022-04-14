import { Box } from "@mui/material";
import Sidebar from "components/Sidebar";

interface Props {
	title?: string | React.ReactNode;
}

const Layout: React.FC<Props> = (props) => {
	const { title, children } = props;

	return (
		<Box className='flex'>
			<Sidebar />
			<Box className='flex flex-col w-full'>
				{title && (
					<Box
						className='px-5 py-3 bg-primary text-slate-700'
						sx={(theme) => ({ background: theme.palette.grey.A200 })}
					>
						<h1 className='text-2xl font-bold'>{title}</h1>
					</Box>
				)}
				<Box className='p-5'>{children}</Box>
			</Box>
		</Box>
	);
};

export default Layout;
