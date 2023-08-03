let numberOfVideos = -1;

let videoData = [];
let videoByCreator = [];

chrome.storage.local.clear();

chrome.storage.sync.get("colors", function (data) {
	let colors = data?.colors || [];
	if (colors.length !== 5) {
		console.log("Unable to set colors");
		return;
	}

	let rootStyle = document.documentElement.style;

	rootStyle.setProperty("--global-shortest", colors[0]);
	rootStyle.setProperty("--global-longest", colors[1]);
	rootStyle.setProperty("--creator-video", colors[2]);
	rootStyle.setProperty("--creator-shortest", colors[3]);
	rootStyle.setProperty("--creator-longest", colors[4]);
});

chrome.runtime.onConnect.addListener(function (port) {
	port.onMessage.addListener(function (req) {
		if (port.name === "mlarmet") {
			switch (req.call) {
				case "load":
					processVideo();
					port.postMessage({ from: "load" });
					break;
				case "loadAll":
					const resizeObserver = new ResizeObserver((entries) => {
						window.scrollTo(0, document.querySelector("ytd-app").clientHeight);

						//if all video in playlist are show
						if (numberOfVideos == document.querySelectorAll("ytd-playlist-video-renderer").length) {
							resizeObserver.disconnect();

							window.scrollTo(0, 0);

							processVideo();

							port.postMessage({ from: "loadAll" });
							port.postMessage({ from: "swal" });

							return;
						}
					});

					resizeObserver.observe(document.querySelector("ytd-app"));
					return;
				case "minmax":
					if (req.creator) showVideoArrayStat(videoByCreator);
					else showVideoArrayStat(videoData);

					chrome.storage.local.get("visibility", function (result) {
						toggleVideos(result?.visibility);
					});
					break;
				case "time":
					if (req.creator) globalTime(videoByCreator);
					else globalTime(videoData);
					break;
				case "videosNumber":
					if (req.creator) videoCount(videoByCreator);
					else {
						videoCount(videoData);
						countCreatorOccurrences(videoData);
					}
					break;
				case "creator":
					findByName(req.creator);

					chrome.storage.local.get("visibility", function (result) {
						toggleVideos(result?.visibility);
					});
					break;
				case "clear":
					clearCssTag();
					toggleVideos("show");
					break;
				case "view":
					toggleVideos(req.toggle);
					break;
				case "print":
					const array = req.creator ? videoByCreator : videoData;
					const sortedArray = videoArray.toSorted(sortTime);

					console.log(array);
					console.log(sortedArray);
					console.log("--------------------------");
					break;
				case "sortElements":
					sortElementsByTime(videoData, req.method);
					break;
				case "creatorList":
					port.postMessage({ from: "creatorList", creatorList: getCreatorsList(videoData) });
					return;
				default:
					console.log("Action invalide reçue");
					break;
			}

			port.postMessage({ from: "swal" });
		}
	});
});

window.addEventListener("load", () => {
	const mutationObserver = new MutationObserver(() => {
		const span = document.querySelector(".metadata-stats span");
		//document.querySelector("div#stats yt-formatted-string span");

		if (span) {
			setTimeout(() => {
				numberOfVideos = parseInt(span.innerText);
			}, 500);

			// showVideoArrayStat(videoData);
			mutationObserver.disconnect();
		}
	});

	const elementToWatch = document.body;
	mutationObserver.observe(elementToWatch, { childList: true });
});

function processVideo() {
	console.clear();
	console.log("--------------------------\n\n\nYoutube WL Stats\n\n\n--------------------------");

	clearCssTag();
	toggleVideos("show");

	videoData = [];

	//numberOfVideos = parseInt(document.querySelector("div#stats yt-formatted-string span").innerText);

	const videoElements = document.querySelectorAll("ytd-playlist-video-renderer");

	Array.from(videoElements).every((video) => {
		const videoTitle = video.querySelector("div#meta a#video-title");
		const videoCreator = video.querySelector("ytd-channel-name a");
		const videoTime = video.querySelector("ytd-thumbnail-overlay-time-status-renderer span#text");
		const videoProgress = video.querySelector("div#progress");
		const videoArriaLabel = video.querySelector("div#meta h3");

		let idx = parseInt(videoTitle.href.split("&")[2].replace("index=", ""));
		let titre = videoTitle.innerText;
		let youtuber = videoCreator.innerText;
		let time = videoTime?.innerText.trim().replace(",", ":");

		let label = removeAccents(videoArriaLabel.getAttribute("aria-label"));
		let motif = " de " + removeAccents(youtuber) + " il y a ";

		let release = label.slice(label.indexOf(motif) + motif.length);

		let watched = false,
			ended = false;

		if (videoProgress) {
			watched = true;
			ended = videoProgress.style.width === "100%" ? true : false;
		}

		if (time == undefined) {
			return false;
		}

		// XX:XX = < 1 hour
		if (time.split(":").length < 3) {
			// Transform to X:XX:XX
			time = "0:" + time;
		}

		const data = { duration: time, creator: youtuber, title: titre, sortie: release, index: idx, state: { watch: watched, end: ended }, element: video };
		videoData.push(data);

		return true;
	});

	const suffix = videoData.length > 1 ? "s" : "";

	chrome.storage.local.set({
		data: {
			load: true,
			display: `${videoData.length} vidéo${suffix} chargée${suffix} sur ${numberOfVideos}`,
		},
	});
}

//=======NUMBER VIDEO=========
function videoCount(videoArray = null) {
	//console.log("--------------------------");
	console.log(`Il y ${numberOfVideos} video${numberOfVideos > 1 ? "s" : ""} en tout.`);
	console.log(`Le programme a traite ${videoData.length} video${numberOfVideos > 1 ? "s" : ""}.`);
	if (videoArray) console.log(`La liste contient ${videoArray.length} video${videoArray.length > 1 ? "s" : ""}.`);
	console.log("--------------------------");
}
//============================

//=======TIME STATE===========
function globalTime(videoArray = []) {
	//console.log("--------------------------");
	if (videoArray.length === 0) {
		console.log(`Erreur : la liste ne contient aucune video`);
	} else {
		let totalTime = 0;
		let h,
			m,
			s = null;

		for (let v of videoArray) {
			[h, m, s] = v.duration.split(":");
			totalTime += parseInt(h) * 60 + parseInt(m) + parseInt(s) / 60;
		}

		console.log(`Le temps moyen d'une video de la liste est de ${(totalTime / videoArray.length).toFixed(2)} minutes.`);
		console.log(
			`Le temps total de la liste est de ${totalTime.toFixed(2)} minutes soit ${(totalTime / 60).toFixed(2)} heures soit ${(
				totalTime /
				(60 * 24)
			).toFixed(2)} jours.`
		);
	}
	console.log("--------------------------");
}
//============================

//=======CREATOR VIDEO========
function findByName(creatorName, watchState = false) {
	//console.log("--------------------------");
	if (!creatorName.trim()) {
		console.log("Erreur : aucun nom de createur n'a ete donne !");
	} else {
		clearCreatorTag();

		videoByCreator = videoData.filter((video) => creatorName.toLowerCase().localeCompare(video.creator.toLowerCase()) == 0);

		console.log(videoByCreator);
		//s at end video
		if (videoByCreator.length > 1) console.log(`Il y a ${videoByCreator.length} videos qui ont ete trouvees dans cette liste`);
		else console.log(`Il y a ${videoByCreator.length} video qui a ete trouvee dans cette liste`);

		if (videoByCreator.length > 0) {
			videoByCreator.forEach((video) => video.element.querySelector("div#index-container")?.classList.add("creator-video"));

			// showVideoArrayStat(videoByCreator, watchState);
		}

		chrome.storage.local.set({ name: creatorName });
	}
	console.log("--------------------------");
}
//============================

//=======VIDEO ARRAY STAT=====
function showVideoArrayStat(videoArray = [], watchState = false) {
	//console.log("--------------------------");
	if (videoArray.length === 0) {
		console.log(`Erreur : la liste ne contient aucune video`);
	} else {
		const sortedVideoArray = videoArray.toSorted(sortTime);

		for (let i = 0; i < 2; i++) {
			const video = sortedVideoArray[i == 0 ? 0 : videoArray.length - 1];
			const [h, m, s] = video.duration.split(":");

			const tag = i == 0 ? "courte" : "longue";

			//if array is the global array
			const cssTag = tag + (videoArray.length === videoData.length ? "-video" : "-creator-video");

			video.element.querySelector("div#index-container")?.classList.add(`${cssTag}`);

			console.log(`La video la plus ${tag} dans la liste dure ${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`);
			console.log(`\t- "${video.title}" (n° ${video.index})`);
			console.log(`\t- De "${video.creator}" sortie le ${video.sortie}`);

			if (watchState) console.log(`Elle ${video.state.watch ? "a" : "n'a pas"} été vu ${video.state.end ? "" : "mais pas "}jusqu'a la fin.`);
		}
	}
	console.log("--------------------------");
}
//============================

//=======CLEAR CSS TAG========
function clearCssTag() {
	//console.log("--------------------------");
	clearShortTag();
	clearLongTag();
	clearCreatorTag();
	console.log("Les tags CSS ont été éffacés.");
	console.log("--------------------------");
}

function clearShortTag() {
	document.querySelectorAll(".courte-video").forEach((video) => video.classList.remove("courte-video"));
}

function clearLongTag() {
	document.querySelectorAll(".longue-video").forEach((video) => video.classList.remove("longue-video"));
}

function clearCreatorTag() {
	document.querySelectorAll(".creator-video").forEach((video) => {
		video.classList.remove("creator-video");
		video.classList.remove("courte-creator-video");
		video.classList.remove("longue-creator-video");
	});
}
//============================

//=======TOGGLE VIDEOS========
function toggleVideos(visibility) {
	const videoContainer = document.querySelectorAll("ytd-playlist-video-renderer");

	videoContainer.forEach((video) => {
		//show all
		if (visibility === "show") {
			video.style.display = "";
		} else {
			//hide
			const index = video.querySelector("div#index-container");
			const indexClass = index.classList;

			let noTag = true;

			for (let aClass of indexClass) {
				if (aClass.indexOf("courte-") != -1 || aClass.indexOf("longue-") != -1 || aClass.indexOf("creator-") != -1) {
					noTag = false;
					break;
				}
			}

			video.style.display = noTag ? "none" : "";
		}
	});

	chrome.storage.local.set({ visibility: visibility });
}
//============================

//=======COUNT OCCURRENCES====
function countCreatorOccurrences(videoArray = []) {
	//console.log("--------------------------");
	if (videoArray.length == 0) {
		console.log(`Erreur : la liste ne contient aucune video`);
	} else {
		const creatorIndexArray = videoArray.reduce((acc, curr) => (acc[curr.creator] ? ++acc[curr.creator] : (acc[curr.creator] = 1), acc), []);

		const occurrences = Object.keys(creatorIndexArray).map((key) => ({ creator: key, count: creatorIndexArray[key] }));
		occurrences.sort((a, b) => b.count - a.count);

		console.log(`Cette liste contient ${occurrences.length} createur${occurrences.length > 1 ? "s" : ""} different${occurrences.length > 1 ? "s" : ""}`);
		console.log(occurrences);
		console.log(
			`Le createur le plus présent dans cette liste est "${occurrences[0].creator}" avec ${occurrences[0].count} video${
				occurrences[0].count > 1 ? "s" : ""
			}`
		);
		console.log(`Cela represente :`);
		console.log(`\t- ${((occurrences[0].count / videoArray.length) * 100).toFixed(2)}% de cette liste`);
		//console.log(`\t- ${((occurrences[0].count / videoData.length) * 100).toFixed(2)}% de la liste global`);
		console.log(`\t- ${((occurrences[0].count / numberOfVideos) * 100).toFixed(2)}% du nombre total de video`);
	}
	console.log("--------------------------");
}
//============================

//=======SORT ELEMENTS========
function getCreatorsList(videoArray = []) {
	//console.log("--------------------------");

	let creators = [];

	if (videoArray.length === 0) {
		console.log(`Erreur : la liste ne contient aucune video`);
	} else {
		const videoCreators = videoArray.map((video) => {
			return video.creator;
		});

		creators = [...new Set(videoCreators)];
	}
	console.log("--------------------------");

	return creators.sort(sortName);
}

function sortElementsByTime(videoArray = [], method = "increase") {
	//console.log("--------------------------");
	if (videoArray.length === 0) {
		console.log(`Erreur : la liste ne contient aucune video`);
	} else {
		chrome.storage.local.set({ sortMethod: method });

		const sortedVideoArray = videoArray.toSorted(sortTime);

		const videoContainer = sortedVideoArray[0].element.parentNode;

		if (method === "increase") {
			// reverse if increase cause prepend (last video in array will be first in page)
			sortedVideoArray.reverse();
		}

		sortedVideoArray.forEach((video) => {
			videoContainer.removeChild(video.element);
			videoContainer.prepend(video.element);
		});

		console.log(`La liste a été triée par durée de facon ${method === "decrease" ? "décroissante" : "croissante"}.`);
	}
	console.log("--------------------------");
}
//============================

// processVideo();
// showVideoArrayStat(videoData);

// "default_icon": {
//     // optional
//     "16": "images/icon16.png", // optional
//     "24": "images/icon24.png", // optional
//     "32": "images/icon32.png" // optional
// },
