const displayer = document.querySelector("#display-info");
const actions = document.querySelector("#actions");
const data = document.querySelector("#data");
const creatorInput = document.querySelector("#creator-input");
const creatorSwitch = document.querySelector("#creator-select");
const hideButton = document.querySelector("#hide");
const showButton = document.querySelector("#show");

function setDisplayText(text) {
	if (!text?.trim()) return;
	displayer.textContent = text;
}
function showVideoLoad() {
	// setDisplayText("Chargement...");

	chrome.storage.local.get(["data"], function (result) {
		if (result?.data?.load) {
			setDisplayText(result.data.display);
			data.style.display = "";
		} else {
			setDisplayText("Erreur lors de la récupération");
			data.style.display = "none";
		}
	});

	chrome.storage.local.get(["name"], function (result) {
		creatorSwitch.checked = false;

		if (result?.name?.trim()) {
			creatorInput.value = result.name;
		} else {
			creatorSwitch.disabled = true;
		}
	});

	chrome.storage.local.get(["visibility"], function (result) {
		if (result?.visibility == true) {
			hideButton.style.display = "block";
			showButton.style.display = "none";
		} else {
			hideButton.style.display = "none";
			showButton.style.display = "block";
		}
	});
}

function showLoadingSwal() {
	Swal.fire({
		// title: "Chargement",
		showConfirmButton: false,
		allowEscapeKey: false,
		allowOutsideClick: false,
		// timer: 2000,
		didOpen: () => {
			Swal.showLoading();
		},
		width: "60%",
		background: "var(--main-color)",
		color: "var(--white)",
	});
}

document.querySelector("#option").addEventListener("click", function () {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		window.open(chrome.runtime.getURL("options.html"));
	}
});

async function init() {
	let connected = true;
	let port = null;

	//====================== PORT =======================
	let queryOptions = { url: "https://www.youtube.com/playlist?list=WL" };
	let tabs = await chrome.tabs.query(queryOptions);

	//not tab found
	if (tabs.length == 0) {
		setDisplayText("Aucun onglet valide ouvert");

		data.style.display = "none";
		connected = false;
		return;
	}
	port = chrome.tabs.connect(tabs[0].id, { name: "mlarmet" });

	port.onDisconnect.addListener(() => {
		connected = false;
		data.style.display = "none";

		if (chrome.runtime.lastError) {
			console.log("runtime error", chrome.runtime.lastError);
			setDisplayText("Connexion impossible");
		}
	});

	if (!connected) {
		return;
	}

	port.onMessage.addListener(function (response) {
		switch (response.from) {
			case "load":
				showVideoLoad();
				break;
			case "swal":
				Swal.close();
				break;
			default:
				console.log("default response pb", response);
				break;
		}
	});

	document.querySelector("#load").addEventListener("click", () => {
		if (connected) {
			creatorSwitch.checked = false;
			hideButton.style.display = "block";
			showButton.style.display = "none";

			showLoadingSwal();

			port.postMessage({
				call: "load",
			});

			//no send view cause load in content toggle it
		} else init();
	});

	document.querySelector("#clear").addEventListener("click", () => {
		if (connected) {
			creatorSwitch.checked = false;
			hideButton.style.display = "block";
			showButton.style.display = "none";

			showLoadingSwal();

			port.postMessage({
				call: "clear",
			});
		}
	});

	document.querySelector("#print").addEventListener("click", () => {
		if (connected) {
			let name = creatorInput.value;
			if (!creatorSwitch.checked) name = null;

			showLoadingSwal();

			port.postMessage({
				call: "print",
				creator: name,
			});
		}
	});

	function sendView(id) {
		if (connected) {
			if (id == "hide") {
				console.log("hide button");
				hideButton.style.display = "none";
				showButton.style.display = "block";
			} else if (id == "show") {
				console.log("show button");
				hideButton.style.display = "block";
				showButton.style.display = "none";
			} else {
				return;
			}

			showLoadingSwal();

			port.postMessage({
				call: "view",
				toggle: id,
			});
		}
	}

	hideButton.addEventListener("click", () => {
		sendView("hide");
	});

	showButton.addEventListener("click", () => {
		sendView("show");
	});

	creatorInput.addEventListener("input", () => {
		let name = creatorInput.value;
		//name incorrect
		if (!name.trim()) {
			// creatorButton.disabled = true;

			creatorSwitch.disabled = true;
			creatorSwitch.checked = false;
		} else {
			// creatorButton.disabled = false;
			creatorSwitch.disabled = false;
		}

		chrome.storage.local.set({ name: name });
	});

	creatorSwitch.addEventListener("change", (e) => {
		if (!creatorSwitch.checked) return;

		if (connected) {
			let name = creatorInput.value;

			showLoadingSwal();

			port.postMessage({
				call: "creator",
				creator: name,
			});
		}
	});

	actions.querySelectorAll("button").forEach((button) => {
		button.addEventListener("click", (e) => {
			if (connected) {
				let action = button.getAttribute("data-action");

				let name = creatorInput.value;
				if (!creatorSwitch.checked) name = null;

				showLoadingSwal();

				port.postMessage({
					call: action,
					creator: name,
				});
			}
		});
	});

	//===================================================

	showVideoLoad();
}

init();
