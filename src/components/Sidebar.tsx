import {
	Drawer,
	IconButton,
	ListItem,
	ListItemIcon,
	ListItemText,
	List,
	Divider,
} from "@mui/material";
import { MdChevronLeft, MdMenu } from "react-icons/md";
import { useState } from "react";
import { drawerStyles } from "component-styles/drawer";
import { menus } from "app/menus";
import { Link } from "react-router-dom";

interface Props {}

const Sidebar: React.FC<Props> = () => {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<Drawer sx={drawerStyles(isOpen)} variant='permanent' open={isOpen}>
			<div className='flex items-center justify-end mr-4'>
				<IconButton
					onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
					sx={{ marginLeft: "8px", color: "primary.contrastText" }}
				>
					{isOpen ? <MdChevronLeft /> : <MdMenu />}
				</IconButton>
			</div>

			<Divider />

			<List sx={{ fontSize: "24px", color: "primary.contrastText" }}>
				{menus.map((menu) => (
					<Link to={menu.path} key={menu.path}>
						<ListItem button>
							<ListItemIcon sx={{ marginLeft: "8px", color: "primary.contrastText" }}>
								{menu.icon}
							</ListItemIcon>
							<ListItemText primary={menu.label} />
						</ListItem>
					</Link>
				))}

				<Divider />
			</List>
		</Drawer>
	);
};

export default Sidebar;
