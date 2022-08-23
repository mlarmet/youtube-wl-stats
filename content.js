let numberOfVideos = -1;
// parseInt(document.querySelector("div#stats yt-formatted-string span")?.innerText);

let videoData = [];

const nowDate = new Date();

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
				case "minmax":
					if (req.creator) showVideoArrayStat(videoByCreator);
					else showVideoArrayStat(videoData);

					chrome.storage.local.get("visibility", function (result) {
						if (result?.visibility == false) {
							toggleVideos(false);
						}
					});
					break;
				case "time":
					if (req.creator) globalTime(videoByCreator);
					else globalTime(videoData);
					break;
				case "videoNumber":
					if (req.creator) videoCount(videoByCreator);
					else videoCount(videoData);
					break;
				case "creator":
					findByName(req.creator);

					chrome.storage.local.get("visibility", function (result) {
						if (result?.visibility == false) {
							toggleVideos(false);
						}
					});
					break;
				case "clear":
					clearCssTag();
					toggleVideos(true);
					break;
				case "view":
					if (req.toggle == "show") toggleVideos(true);
					else if (req.toggle == "hide") toggleVideos(false);
					break;
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
		const span = document.querySelector("div#stats yt-formatted-string span");

		if (span) {
			setTimeout(() => {
				processVideo();
			}, 500);

			// showVideoArrayStat(videoData);
			mutationObserver.disconnect();
		}
	});

	const elementToWatch = document.body;
	mutationObserver.observe(elementToWatch, { childList: true });
});

function processVideo() {
	// console.clear();
	console.log("--------------------------\n\n\nYoutube WL Stats\n\n\n--------------------------");

	clearCssTag();
	toggleVideos(true);

	videoData = [];

	numberOfVideos = parseInt(document.querySelector("div#stats yt-formatted-string span").innerText);

	const videoContainer = document.querySelectorAll("ytd-playlist-video-renderer");

	Array.from(videoContainer).every((video) => {
		//if same time, new Date() give different miliseconds
		//let date = new Date();

		const videoTitle = video.querySelector("div#meta a#video-title");
		const videoCreator = video.querySelector("ytd-channel-name a");
		const videoTime = video.querySelector("ytd-thumbnail-overlay-time-status-renderer span#text");
		const videoProgress = video.querySelector("div#progress");

		let idx = parseInt(videoTitle.href.split("&")[2].replace("index=", ""));
		let titre = videoTitle.innerText;
		let youtuber = videoCreator.innerText;
		let time = videoTime?.innerText.trim().replace(",", ":");

		let watched = false,
			ended = false;

		if (videoProgress) {
			watched = true;
			ended = videoProgress.style.width === "100%" ? true : false;
		}

		if (time == undefined) {
			return false;
		}

		if (time.split(":").length < 3) {
			//<1h
			time = "0:" + time;
		}

		let data = { duration: time, creator: youtuber, title: titre, sortie: null, index: idx, state: { watch: watched, end: ended }, element: video };
		videoData.push(data);

		return true;
	});

	chrome.storage.local.set({
		data: {
			load: true,
			display: `${videoData.length} vidéo${videoData.length > 1 ? "s" : ""} 
			chargée${videoData.length > 1 ? "s" : ""} 
			sur ${numberOfVideos}`,
		},
	});
}

//=======NUMBER VIDEO=========
function videoCount(videoArray = null) {
	console.log("--------------------------");
	console.log(`Il y ${numberOfVideos} video${numberOfVideos > 1 ? "s" : ""} en tout.`);
	console.log(`Le programme a traite ${videoData.length} video${numberOfVideos > 1 ? "s" : ""}.`);
	if (videoArray) console.log(`La liste contient ${videoArray.length} video${videoArray.length > 1 ? "s" : ""}.`);
	console.log("--------------------------");
}
//============================

//=======TIME STATE===========
function globalTime(videoArray) {
	console.log("--------------------------");
	if (!videoArray || videoArray.length == 0) {
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
		console.log(`Le temps total de la liste est de ${totalTime.toFixed(2)} minutes soit ${(totalTime / 60).toFixed(2)} heures soit ${(totalTime / (60 * 24)).toFixed(2)} jours.`);
	}
	console.log("--------------------------");
}
//============================

//=======CREATOR VIDEO========
let videoByCreator = [];
function findByName(creatorName, watchState = false) {
	console.log("--------------------------");
	if (!creatorName.trim()) {
		console.log("Erreur : aucun nom de createur n'a ete donne !");
	} else {
		clearCreatorTag();

		videoByCreator = videoData.filter((video) => creatorName.toLowerCase().localeCompare(video.creator.toLowerCase()) == 0);

		console.log(videoByCreator);
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
function showVideoArrayStat(videoArray, watchState = false) {
	console.log("--------------------------");
	if (videoArray.length == 0) {
		console.log(`Erreur : la liste ne contient aucune video`);
	} else {
		for (let i = 0; i < 2; i++) {
			//sort the new array
			let sortedVideoArray = [];
			Object.assign(sortedVideoArray, videoArray);
			sortedVideoArray.sort(sortTime);

			let video = sortedVideoArray[i == 0 ? 0 : videoArray.length - 1];
			let [h, m, s] = video.duration.split(":");

			let tag = i == 0 ? "courte" : "longue";

			//if array is the global array
			let cssTag = tag + (videoArray.length === videoData.length ? "-video" : "-creator-video");

			video.element.querySelector("div#index-container")?.classList.add(`${cssTag}`);

			console.log(`La video la plus ${tag} dans la liste dure ${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`);
			console.log(`-> "${video.title}" (n° ${video.index})`);
			console.log(`-> De "${video.creator}" sortie le ${video.sortie}`);

			if (watchState) console.log(`Elle ${video.state.watch ? "a" : "n'a pas"} été vu ${video.state.end ? "" : "mais pas "}jusqu'a la fin.`);
		}
	}
	console.log("--------------------------");
}
//============================

//=======CLEAR CSS TAG========
function clearCssTag() {
	console.log("--------------------------");
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
		if (visibility) {
			video.style.display = "";
		} else {
			//hide
			let index = video.querySelector("div#index-container");
			let indexClass = index.classList;

			let noTag = Array.from(indexClass).every((aClass) => aClass.indexOf("courte-") == -1 && aClass.indexOf("longue-") == -1 && aClass.indexOf("creator-") == -1);

			// video.style.display = noTag ? "none" : "";

			if (noTag) {
				video.style.display = "none";
			} else {
				//reset display if tag add after hide
				video.style.display = "";
			}
		}
	});

	chrome.storage.local.set({ visibility: visibility });
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
