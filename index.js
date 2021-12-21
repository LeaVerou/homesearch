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

	if (value == "Unknown" || !value || !classes || classes.length === 0) {
		return "";
	}
	classes = classes.flat().filter(e => !!e);

	if (classes.length === 0) {
		return "";
	}

	classes = Object.assign(...classes);

	for (let cl of allClasses) {
		let breakpoint = Mavo.value(classes[cl]);

		if (breakpoint === null) {
			delete classes[cl];
		}
		else if (breakpoint == value) {
			return cl;
		}
	}

	// If we're here, these are ranges
	let breakpoints = Object.values(classes);
	let increasing = breakpoints[0] < breakpoints[1];

	for (let cl of allClasses) {
		let breakpoint = classes[cl];

		if (breakpoint == "*"){
			// We need to do this on a second pass, because otherwise if it appears in the middle, we'd never get to anything after it
			return cl;
		}

		if (!isNaN(value)) { // is numeric?
			if (increasing && value < breakpoint || !increasing && value > breakpoint) {
				return cl;
			}
		}


	}
}