function sortTime(a, b) {
	let [h1, m1, s1] = a.duration.split(":"),
		[h2, m2, s2] = b.duration.split(":");

	if (h1 === h2) {
		if (m1 === m2) return s1 - s2;

		return m1 - m2;
	}
	return h1 - h2;
}

function sortDate(a, b) {
	return Number(a) - Number(b);
}
