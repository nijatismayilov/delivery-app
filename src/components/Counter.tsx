import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface Props {
	value: number;
	initialValue?: number;
	fixedPoint?: number;
	duration?: number;
}

const Counter: React.FC<Props> = (props) => {
	const { value, initialValue = 0, fixedPoint = 2, duration = 0.2 } = props;
	const nodeRef = useRef<HTMLParagraphElement>(null);
	const prevValue = useRef(initialValue);

	useEffect(() => {
		const node = nodeRef.current;

		if (!node) return;

		const controls = animate(prevValue.current, value, {
			duration,
			onUpdate(value) {
				node.textContent = value.toFixed(fixedPoint);
			},
		});

		prevValue.current = value;

		return () => controls.stop();
	}, [duration, fixedPoint, value]);

	return <p ref={nodeRef} />;
};

export default Counter;
