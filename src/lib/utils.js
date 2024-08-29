function sortTime(a, b) {
	let [h1, m1, s1] = a.duration.split(":").map(Number),
		[h2, m2, s2] = b.duration.split(":").map(Number);

	if (h1 !== h2) return h1 - h2;

	if (m1 !== m2) return m1 - m2;

	return s1 - s2;
}

function sortDate(a, b) {
	return Number(a) - Number(b);
}

function sortName(a, b) {
	return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function removeAccents(string) {
	return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function log(message) {
	if (OUTPUT) {
		console.log(message);
	}
}

function error(message) {
	console.error(message);
}

function clear() {
	if (CLEAR_OUTPUT) {
		console.clear();
	}
}
