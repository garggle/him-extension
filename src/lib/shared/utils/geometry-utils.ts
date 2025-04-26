// Helper function to calculate distance between two points
const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export { calculateDistance };
