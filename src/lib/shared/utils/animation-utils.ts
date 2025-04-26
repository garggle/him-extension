// Helper function for easing animations
const easeInOut = (t: number): number => {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export { easeInOut };
