// Helper functions for color calculations
const rgbaHexToHex = (rgbaHex: string): string => {
	// Remove alpha channel and any transparency notation
	return rgbaHex.replace(/[0-9a-f]{2}(?!.*[0-9a-f]{2})/i, '');
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
	// Remove # if present
	hex = hex.replace('#', '');

	// Parse r, g, b values
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	return { r, g, b };
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	// Convert to degrees and percentages
	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100)
	};
};

const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
	const rgb = hexToRgb(hex);
	return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

export { hexToHsl, hexToRgb, rgbaHexToHex, rgbToHsl };
