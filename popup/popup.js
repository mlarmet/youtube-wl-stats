const displayer = document.querySelector("#display-info");
const playlistLink = document.querySelector("#playlist-link");
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
	setDisplayText("Chargement...");

	chrome.storage.local.get(["data"], function (result) {
		if (result?.data?.load) {
			setDisplayText(result.data.display);
			data.style.display = "";
		} else {
			data.style.display = "none";

			port.postMessage({
				call: "loadAll",
			});

			showLoadingSwal();

			// setDisplayText("Erreur lors de la récupération");
			// data.style.display = "none";
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
		timer: 20000, //secure if load all failed
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
	let port = null;
	let connected = true;
	playlistLink.style.display = "none";

	//====================== PORT =======================
	let queryOptions = { url: "https://www.youtube.com/playlist?list=WL" };
	let tabs = await chrome.tabs.query(queryOptions);

	//not tab found
	if (tabs.length == 0) {
		setDisplayText("Aucun onglet valide ouvert");
		playlistLink.style.display = "block";
		data.style.display = "none";
		connected = false;
		Swal.close();
		return;
	}
	port = chrome.tabs.connect(tabs[0].id, { name: "mlarmet" });

	port.onDisconnect.addListener(() => {
		connected = false;
		data.style.display = "none";

		if (chrome.runtime.lastError) {
			console.log("runtime error", chrome.runtime.lastError);
			setDisplayText("Connexion impossible");
			Swal.close();
		}
	});

	if (!connected) {
		Swal.close();
		return;
	}

	port.onMessage.addListener(function (response) {
		switch (response.from) {
			case "load":
				showVideoLoad();
				break;
			case "loadAll":
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
		if (!connected) {
			init();
			return;
		}

		creatorSwitch.checked = false;
		hideButton.style.display = "block";
		showButton.style.display = "none";

		showLoadingSwal();

		port.postMessage({
			call: "load",
		});
	});

	document.querySelector("#clear").addEventListener("click", () => {
		if (!connected) {
			return;
		}

		creatorSwitch.checked = false;
		hideButton.style.display = "block";
		showButton.style.display = "none";

		showLoadingSwal();

		port.postMessage({
			call: "clear",
		});
	});

	document.querySelector("#print").addEventListener("click", () => {
		if (!connected) {
			return;
		}

		const name = creatorSwitch.checked ? creatorInput.value : null;

		showLoadingSwal();

		port.postMessage({
			call: "print",
			creator: name,
		});
	});

	function showVideoLoad() {
		chrome.storage.local.get(["data"], function (result) {
			if (result?.data?.load) {
				setDisplayText(result.data.display);
				data.style.display = "";
			} else {
				data.style.display = "none";
				//setDisplayText("Chargement...");

				showLoadingSwal();

				port.postMessage({
					call: "loadAll",
				});

				// setDisplayText("Erreur lors de la récupération");
				// data.style.display = "none";
			}
		});
	}

	function sendView(id) {
		if (!connected) {
			return;
		}

		if (id == "hide") {
			hideButton.style.display = "none";
			showButton.style.display = "block";
		} else if (id == "show") {
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
		if (!creatorSwitch.checked || !connected) {
			return;
		}

		const name = creatorInput.value;

		showLoadingSwal();

		port.postMessage({
			call: "creator",
			creator: name,
		});
	});

	actions.querySelectorAll("button").forEach((button) => {
		button.addEventListener("click", (e) => {
			if (!connected) {
				return;
			}

			const action = button.getAttribute("data-action");

			const name = creatorSwitch.checked ? creatorInput.value : null;

			showLoadingSwal();

			port.postMessage({
				call: action,
				creator: name,
			});
		});
	});

	//===================================================

	showVideoLoad();
}

init();
