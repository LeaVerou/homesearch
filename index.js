function getWebsite(url) {
	return !!Mavo.value(url) ? new URL(url).host.replace(/^www\./, "") : "(Website)";
}

// Workaround for Mavo bug #764
document.addEventListener("click", evt => {
	if (evt.target.hasAttribute("property") && evt.target.closest('[mv-mode="edit"] a')) {
		evt.preventDefault();
	}
});

const allClasses = ["great", "good", "ok", "bad", "terrible"];

function classify(value, ...classes) {
	value = Mavo.value(value);

	if (value == "Unknown" || !value) {
		return "";
	}

	classes = Object.assign(...classes);

	for (let cl in classes) {
		let breakpoint = classes[cl];
		if (breakpoint == value || breakpoint == "*") {
			return cl;
		}
	}

	// If we're here, these are ranges
	let breakpoints = Object.values(classes);
	let increasing = breakpoints[0] < breakpoints[1];

	for (let cl in classes) {
		let breakpoint = classes[cl];

		if (increasing && value < breakpoint || !increasing && value > breakpoint) {
			return cl;
		}
	}
}