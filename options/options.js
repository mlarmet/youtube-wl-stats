const globalShortest = document.querySelector("#global-shortest");
const globalLongest = document.querySelector("#global-longest");

const creatorColor = document.querySelector("#creator-color");
const creatorShortest = document.querySelector("#creator-shortest");
const creatorLongest = document.querySelector("#creator-longest");

const saveButton = document.querySelector("#save");
const resetButton = document.querySelector("#reset");

function setDefaultColors() {
	globalShortest.value = "#008000";
	globalLongest.value = "#ff0000";

	creatorColor.value = "#0000ff";
	creatorShortest.value = "#9acd32";
	creatorLongest.value = "#ff6347";
}

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
		if (globalShortest.value == "#008000" && globalLongest.value == "#ff0000" && creatorColor.value == "#0000ff" && creatorShortest.value == "#9acd32" && creatorLongest.value == "#ff6347") {
			//disable reset button
			resetButton.disabled = true;
		}
	});
});

// window.addEventListener("beforeunload", (e) => {
// 	//save button not disable mean colors changes not saved
// 	if (saveButton.getAttribute("disabled") == null) {
// 		//swal alert
// 		return confirm("Nouvelles couleurs non enregitrées");
// 	}
// });

saveButton.addEventListener("click", (e) => {
	const globalShortestValue = globalShortest.value;
	const globalLongestValue = globalLongest.value;

	const creatorColorValue = creatorColor.value;
	const creatorShortestValue = creatorShortest.value;
	const creatorLongestValue = creatorLongest.value;

	chrome.storage.sync.set({ colors: [globalShortestValue, globalLongestValue, creatorColorValue, creatorShortestValue, creatorLongestValue] }, (e) => {
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

let colorsChanged = false;
document.querySelectorAll(".picker").forEach((colorPicker) => {
	colorPicker.addEventListener("change", (e) => {
		saveButton.disabled = false;
		resetButton.disabled = false;
	});
});

resetButton.addEventListener("click", (e) => {
	setDefaultColors();

	resetButton.disabled = true;

	chrome.storage.sync.get("colors", function (data) {
		let gs = data.colors[0];
		let gl = data.colors[1];

		let cc = data.colors[2];
		let cs = data.colors[3];
		let cl = data.colors[4];

		//if color on reset are same as load
		if (globalShortest.value == gs && globalLongest.value == gl && creatorColor.value == cc && creatorShortest.value == cs && creatorLongest.value == cl) {
			saveButton.disabled = true;
		} else {
			saveButton.disabled = false;
		}
	});
});
