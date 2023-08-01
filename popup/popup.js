const displayer = document.querySelector("#display-info");
const playlistLink = document.querySelector("#playlist-link");
const data = document.querySelector("#data");

const hideButton = document.querySelector("#hide");
const showButton = document.querySelector("#show");

const actions = document.querySelector("#actions");

const arrowDecrease = document.querySelector("#arrow-decrease");
const arrowIncrease = document.querySelector("#arrow-increase");

const creatorInput = document.querySelector("#creator-input");
const creatorSwitch = document.querySelector("#creator-select");

const creatorSuggestions = document.getElementById("creator-suggestions");

let creatorList = [];

creatorInput.addEventListener("input", (e) => {
	const nameContent = creatorInput.value;

	filterSuggestions(nameContent);
});

function filterSuggestions(nameValue) {
	const matchNameList = [];

	if (nameValue.trim() !== "") {
		for (let name of creatorList) {
			if (name.toLowerCase().includes(nameValue.toLowerCase())) {
				matchNameList.push(name);
			}
		}
	}

	showSuggestions(matchNameList);
}

function showSuggestions(matchNameList) {
	creatorSuggestions.querySelectorAll("li").forEach((name) => {
		name.style.display = "none";
	});

	creatorSuggestions.style.borderWidth = matchNameList.length >= 1 ? "2px" : "0";
	creatorSuggestions.style.marginTop = matchNameList.length >= 1 ? "0.5em" : "0";
	creatorSuggestions.style.overflowY = matchNameList.length >= 4 ? "scroll" : "hidden";

	for (let name of matchNameList) {
		const li = creatorSuggestions.querySelector("#" + name.replace(/ /g, "-"));
		if (li) {
			li.style.display = "block";
		}
	}
}

function setCreatorList(list) {
	creatorSuggestions.style.borderWidth = "0";
	creatorSuggestions.style.marginTop = "0";
	creatorSuggestions.style.overflowY = "hidden";

	creatorList = list;

	for (let name of creatorList) {
		let liElem = document.createElement("li");
		liElem.textContent = name;
		liElem.id = name.replace(/ /g, "-");
		liElem.style.display = "none";

		liElem.addEventListener("click", (e) => {
			setCreator(name);
		});

		creatorSuggestions.appendChild(liElem);
	}
}

function setCreator(name) {
	creatorInput.value = name;

	creatorSuggestions.querySelectorAll("li").forEach((name) => {
		name.style.display = "none";
	});

	creatorSuggestions.style.borderWidth = "0";
	creatorSuggestions.style.marginTop = "0";
}

function setDisplayText(text) {
	if (!text?.trim()) return;
	displayer.textContent = text;
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

function swapVisibilityButton(visibility) {
	if (visibility) {
		hideButton.style.display = "block";
		showButton.style.display = "none";
	} else {
		hideButton.style.display = "none";
		showButton.style.display = "block";
	}
}

function swapArrowSort(method) {
	if (method === "decrease") {
		arrowDecrease.style.display = "inline-block";
		arrowIncrease.style.display = "none";
	} else if (method === "increase") {
		arrowDecrease.style.display = "none";
		arrowIncrease.style.display = "inline-block";
	}
}

function showVideoLoad() {
	chrome.storage.local.get(["data"], function (result) {
		if (result?.data?.load) {
			setDisplayText(result.data.display);
			data.style.display = "";

			port?.postMessage({
				call: "creatorList",
			});
		} else {
			data.style.display = "none";
			//setDisplayText("Chargement...");

			showLoadingSwal();

			port?.postMessage({
				call: "loadAll",
			});

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
		swapVisibilityButton(result?.visibility);
	});

	chrome.storage.local.get(["sortMethod"], function (result) {
		swapArrowSort(result?.sortMethod);
	});
}

document.querySelector("#option").addEventListener("click", function () {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		window.open(chrome.runtime.getURL("options.html"));
	}
});

let port = null;
let connected = true;

async function init() {
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
			case "creatorList":
				setCreatorList(response.creatorList || []);
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

		swapVisibilityButton(true);

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

		swapVisibilityButton(true);

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

	function sendView(id) {
		if (!connected) {
			return;
		}

		swapVisibilityButton(id === "show");

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

			showLoadingSwal();

			const action = button.getAttribute("data-action");
			const name = creatorSwitch.checked ? creatorInput.value : null;

			const message = {
				call: action,
				creator: name,
			};

			if (action === "sortElements") {
				const method = arrowDecrease.style.display === "none" ? "decrease" : "increase";

				swapArrowSort(method);

				message.method = method;
			}

			port.postMessage(message);
		});
	});

	//===================================================

	showVideoLoad();
}

init();
