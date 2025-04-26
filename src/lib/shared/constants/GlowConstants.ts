const MOBILE_BREAKPOINT = 768;
// Star color palettes matching the theme
const starPalettes = [
	// Each palette has core, middle, and outer glow colors
	{
		core: '#ffd6f6',
		mid: '#DD459C',
		outer: '#7945A5'
	},
	{
		core: '#E8A3C4',
		mid: '#B768A2',
		outer: '#7945A5'
	},
	{
		core: '#ffd6f6',
		mid: '#9370DB',
		outer: '#7945A5'
	},
	{
		core: '#E0B0FF',
		mid: '#8A2BE2',
		outer: '#7945A5'
	}
];

// Nebula color palette definitions
const nebulaPalettes = [
	// Mixed (purple/violet)
	[
		{ offset: 0, color: '#D0A0F050' },
		{ offset: 0.5, color: '#8040C020' },
		{ offset: 1, color: '#40008000' }
	],
	// Pink/magenta
	[
		{ offset: 0, color: '#FF80E050' },
		{ offset: 0.5, color: '#D040A020' },
		{ offset: 1, color: '#80004000' }
	]
];

export { MOBILE_BREAKPOINT, nebulaPalettes, starPalettes };
