const globalShortest = document.querySelector("#global-shortest");
const globalLongest = document.querySelector("#global-longest");

const creatorColor = document.querySelector("#creator-color");
const creatorShortest = document.querySelector("#creator-shortest");
const creatorLongest = document.querySelector("#creator-longest");

const saveButton = document.querySelector("#save");
const resetButton = document.querySelector("#reset");

const DEFAULT_SHORTEST = "#008000";
const DEFAULT_LONGEST = "#ff0000";

const DEFAULT_CREATOR_COLOR = "#0000ff";
const DEFAULT_CREATOR_SHORTEST = "#9acd32";
const DEFAULT_CREATOR_LONGEST = "#ff6347";

const setDefaultColors = () => {
	globalShortest.value = DEFAULT_SHORTEST;
	globalLongest.value = DEFAULT_LONGEST;

	creatorColor.value = DEFAULT_CREATOR_COLOR;
	creatorShortest.value = DEFAULT_CREATOR_SHORTEST;
	creatorLongest.value = DEFAULT_CREATOR_LONGEST;
};

window.addEventListener("load", () => {
	chrome.storage.sync.get("colors", function (data) {
		if (data?.colors) {
			globalShortest.value = data.colors[0];
			globalLongest.value = data.colors[1];

			creatorColor.value = data.colors[2];
			creatorShortest.value = data.colors[3];
			creatorLongest.value = data.colors[4];
		} else {
			setDefaultColors();
		}

		saveButton.disabled = true;

		//if colors in storage are defaults ones
		if (
			globalShortest.value === DEFAULT_SHORTEST &&
			globalLongest.value === DEFAULT_LONGEST &&
			creatorColor.value === DEFAULT_CREATOR_COLOR &&
			creatorShortest.value === DEFAULT_CREATOR_SHORTEST &&
			creatorLongest.value === DEFAULT_CREATOR_LONGEST
		) {
			//disable reset button
			resetButton.disabled = true;
		}
	});
});

saveButton.addEventListener("click", () => {
	const globalShortestValue = globalShortest.value;
	const globalLongestValue = globalLongest.value;

	const creatorColorValue = creatorColor.value;
	const creatorShortestValue = creatorShortest.value;
	const creatorLongestValue = creatorLongest.value;

	chrome.storage.sync.set({ colors: [globalShortestValue, globalLongestValue, creatorColorValue, creatorShortestValue, creatorLongestValue] }, () => {
		Swal.fire({
			icon: "success",
			title: "Options enregistrées !",
			buttonsStyling: false,
			customClass: {
				confirmButton: "btn",
			},
			timer: 3000,
			width: "300px",
			background: "var(--main-color)",
			color: "var(--white)",
		});

		saveButton.disabled = true;
	});
});
document.querySelectorAll(".picker").forEach((colorPicker) => {
	colorPicker.addEventListener("change", () => {
		saveButton.disabled = false;
		resetButton.disabled = false;
	});
});

resetButton.addEventListener("click", () => {
	setDefaultColors();

	resetButton.disabled = true;

	chrome.storage.sync.get("colors", function (data) {
		const gs = data.colors[0];
		const gl = data.colors[1];

		const cc = data.colors[2];
		const cs = data.colors[3];
		const cl = data.colors[4];

		//if color on reset are same as load
		saveButton.disabled =
			globalShortest.value === gs &&
			globalLongest.value === gl &&
			creatorColor.value === cc &&
			creatorShortest.value === cs &&
			creatorLongest.value === cl;
	});
});
