export const initSearchControls = ({ titleInput, yearInput, typeSelect, searchButton }) => {
	if (!titleInput || !yearInput || !typeSelect || !searchButton) {
		return;
	}

	const updateSearchButtonState = () => {
		const hasTitle = titleInput.value.trim() !== "";

		searchButton.disabled = !hasTitle;
	};

	titleInput.addEventListener("input", updateSearchButtonState);
	yearInput.addEventListener("input", updateSearchButtonState);
	typeSelect.addEventListener("change", updateSearchButtonState);

	updateSearchButtonState();
};
