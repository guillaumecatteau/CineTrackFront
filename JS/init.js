document.addEventListener("DOMContentLoaded", () => {
	const titleInput = document.getElementById("title");
	const yearInput = document.getElementById("year");
	const typeSelect = document.getElementById("type");
	const searchButton = document.getElementById("search-button");

	if (!titleInput || !yearInput || !typeSelect || !searchButton) {
		return;
	}

	const updateSearchButtonState = () => {
		const hasTitle = titleInput.value.trim() !== "";
		const hasYear = yearInput.value.trim() !== "";
		const hasType = typeSelect.value !== "";

		searchButton.disabled = !(hasTitle || hasYear || hasType);
	};

	titleInput.addEventListener("input", updateSearchButtonState);
	yearInput.addEventListener("input", updateSearchButtonState);
	typeSelect.addEventListener("change", updateSearchButtonState);

	updateSearchButtonState();
});
