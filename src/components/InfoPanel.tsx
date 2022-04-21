import { useState } from "react";
import { motion } from "framer-motion";
import { FcInfo } from "react-icons/fc";
import { Box } from "@mui/material";
import { IoMdCloseCircle } from "react-icons/io";

interface Props {}

const InfoPanel: React.FC<Props> = (props) => {
	const [expanded, setExpanded] = useState(false);

	return (
		<motion.div
			style={{
				position: "fixed",
				bottom: "15px",
				right: "0px",
				background: "#fff",
				padding: 16,
				width: "350px",
			}}
			className='shadow-xl border border-gray-200 rounded-l-lg rounded-bl-none'
			animate={{ x: expanded ? "0" : "100%" }}
			transition={{ stiffness: 350, type: "spring", damping: 30 }}
			initial={false}
		>
			<Box
				sx={{ position: "absolute", right: "100%", bottom: "-1px", background: "#fff", padding: 1 }}
				className='shadow-xl border border-gray-200 rounded-l-lg border-r-0 cursor-pointer'
				onClick={() => setExpanded((prev) => !prev)}
			>
				{expanded ? <IoMdCloseCircle size={30} color='#000' /> : <FcInfo size={30} />}
			</Box>
			Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe in ipsam laborum iure eos
			incidunt necessitatibus eius, magnam vel facilis explicabo aperiam! Ab nihil non reiciendis.
			Alias ratione vero quis!
		</motion.div>
	);
};

export default InfoPanel;
