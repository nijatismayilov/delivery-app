import { CSSObject, SxProps, Theme } from "@mui/material";

const drawerWidth = 240;

export type DrawerSxProps = (open: boolean) => SxProps<Theme>;

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: "hidden",
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up("sm")]: {
		width: `calc(${theme.spacing(9)} + 1px)`,
	},
});

export const drawerStyles: DrawerSxProps = (open) => (theme) => {
	const mixin = open ? openedMixin : closedMixin;
	const computedStyles = {
		...mixin(theme),
		"& .MuiDrawer-paper": { ...mixin(theme), backgroundColor: theme.palette.primary.main },
	};

	return {
		width: drawerWidth,
		flexShrink: 0,
		whiteSpace: "nowrap",
		boxSizing: "border-box",
		...computedStyles,
	};
};
