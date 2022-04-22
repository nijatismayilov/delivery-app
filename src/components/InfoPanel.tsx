import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FcInfo } from "react-icons/fc";
import { Box } from "@mui/material";
import { IoMdCloseCircle } from "react-icons/io";
import * as workerTimers from "worker-timers";
import InfoPanelItem from "./InfoPanelItem";

const { setTimeout, clearTimeout } = workerTimers;

export class Timer {
	private expected: number = -Infinity;
	private timeout: number = -Infinity;

	constructor(private callback: Function, private interval: number) {}

	public start() {
		this.expected = Date.now() + this.interval;
		this.timeout = setTimeout(this.round, this.interval);
	}

	public stop() {
		if (this.timeout !== -Infinity) {
			clearTimeout(this.timeout);
		}
	}

	private round = () => {
		this.callback();

		const drift = Date.now() - this.expected;
		this.expected += this.interval;
		this.timeout = setTimeout(this.round, this.interval - drift);
	};
}

const currentTime = () => {
	let date = new Date();
	let ss = date.getSeconds();

	return ss;
};

interface Props {}

const InfoPanel: React.FC<Props> = (props) => {
	const [expanded, setExpanded] = useState(false);
	const [progress, setProgress] = useState(0);
	const [seconds, setSeconds] = useState(0);
	const [locationUpdateProgress, setLocationUpdateProgress] = useState(0);
	const [locationUpdateSeconds, setLocationUpdateSeconds] = useState(0);

	useEffect(() => {
		const currentSeconds = currentTime();

		setProgress((currentSeconds / 60) * 100);
		setSeconds(currentSeconds);

		// Location update happens roughly every 60 / 5 = 12 seconds
		// So every 100% of the progress bar is 12 seconds
		// So every 1% of the progress bar is 0.012 seconds
		// We need to first find out how many seconds do we have left
		const currentLocationUpdateCycle = Math.floor(60 / currentSeconds);
		const locationUpdateSecondsLeft = Math.abs(currentLocationUpdateCycle * 12 - currentSeconds);
		const locationUpdateProgress = (locationUpdateSecondsLeft / 12) * 100;
		setLocationUpdateProgress(locationUpdateProgress);
		setLocationUpdateSeconds(locationUpdateSecondsLeft);

		const timer = new Timer(() => {
			setProgress((prev) => {
				if (prev >= 100) return 0;

				return prev + (1 / 60) * 100;
			});

			setSeconds((prev) => {
				if (prev >= 60) return 0;

				return prev + 1;
			});

			setLocationUpdateProgress((prev) => {
				return prev + (1 / 12) * 100 >= 100 ? 0 : prev + (1 / 12) * 100;
			});

			setLocationUpdateSeconds((prev) => {
				if (prev >= 12) return 0;

				return prev + 1;
			});
		}, 1000);

		timer.start();

		return () => {
			timer.stop();
		};
	}, []);

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
				{expanded ? (
					<IoMdCloseCircle size={30} color='#26a7ed' />
				) : (
					<FcInfo size={30} color='#26a7ed' />
				)}
			</Box>

			<>
				<InfoPanelItem
					title='Next Vehicle Schedule'
					color='#26a7ed'
					progress={progress}
					seconds={seconds}
				/>

				<InfoPanelItem
					title='Next Vehicle Location Updates'
					color='#26a7a0'
					progress={locationUpdateProgress}
					seconds={locationUpdateSeconds}
				/>
			</>
		</motion.div>
	);
};

export default InfoPanel;
