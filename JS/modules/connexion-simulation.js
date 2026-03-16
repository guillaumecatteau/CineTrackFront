export const connected = false;

export const RESULTS_PER_PAGE = 25;
export const TOTAL_MOCK_RESULTS = 50;

export const mockResults = Array.from({ length: TOTAL_MOCK_RESULTS }, (_item, index) => {
	const position = index + 1;
	const likes = 20 + ((position * 7) % 300);
	const dislikes = 5 + ((position * 3) % 120);
	const stars = (position % 5) + (position % 2 ? 0.5 : 0);

	return {
		title: `Mock Movie ${position}`,
		year: String(1980 + (position % 45)),
		likes: String(likes),
		dislikes: String(dislikes),
		stars: String(Math.min(5, stars)),
		summary: `This is the temporary summary for Mock Movie ${position}. It is used to test the selection panel layout and descriptive content before backend integration.`,
		poster: "images/logo_CineTrack.png"
	};
});
