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
const classified = "." + allClasses.join(", .")

function classify(value, ...classes) {
	value = Mavo.value(value);
	let isNumeric = !isNaN(value);

	if (value == "Unknown" || !value || !classes || classes.length === 0) {
		return "";
	}
	classes = classes.flat().filter(e => !!e);

	if (classes.length === 0) {
		return "";
	}

	classes = Object.assign(...classes);

	let breakpoints = allClasses.map(cl => classes[cl]);
	let increasing;

	if (isNumeric) {
		// Are the breakpoints also numeric?
		isNumeric = isNumeric && breakpoints.every(e => !isNaN(e));

		// If increasing = true, this means the lower the value, the better the score
		// I.e. great < good < ok < bad < terrible
		increasing = breakpoints[0] < breakpoints[1];

		if (isNumeric) {
			if (increasing) {
				breakpoints.push(Infinity);
			}
			else {
				breakpoints.unshift(Infinity);
			}

			value = Number(value);
		}
	}

	let ret;

	let tiers = {};

	for (let i=0; i < allClasses.length; i++) {
		let cl = allClasses[i];

		let breakpoint = Mavo.value(classes[cl]);

		if (isNumeric) {
			tiers[cl] = [
				Number(breakpoints[i]),
				Number(breakpoints[i + 1])
			]

		}
		else {
			tiers[cl] = breakpoint;
		}
	}

	for (let cl of allClasses) {
		let breakpoint = Mavo.value(classes[cl]);

		if (breakpoint === null || breakpoint === "") {
			delete classes[cl];
		}
		else if (breakpoint == value) {
			return cl;
		}
		else if (breakpoint == "*") {
			ret = cl; // candidate return value, but we don't return yet because it may match other values exactly
		}
		else if (isNumeric) { // is numeric?
			let [start, end] = tiers[cl];

			if (increasing) {
				if (start < value && value < end) {
					return cl;
				}
			}
			else {
				if (start > value && value > end) {
					return cl;
				}
			}
		}
	}

	if (ret !== undefined) {
		return ret;
	}

	// If we're here, we're in a range, but not in any of the classes, extrapolate
	if (isNumeric) {
		let lastBreakpoint = breakpoints[breakpoints.length - 1];

		if (increasing) {
			if (value < breakpoints[0]) {
				return "great"
			}
			else if (value > lastBreakpoint) {
				return "terrible"
			}
		}
		else {
			if (value < breakpoints[0]) {
				return "terrible"
			}
			else if (value > lastBreakpoint) {
				return "great"
			}
		}
	}
}

function classifyCommute(commute) {
	commute = Mavo.value(commute);

	if (!commute) {
		return "";
	}

	let g = commute.match(/(?<mins>\d+) min (?<type>\w+)/)?.groups;

	if (g.type === "walk") {
		return g.mins < 9 ? "great" : "ok";
	}
	else if (g.type === "drive") {
		return g.mins < 10 ? "bad" : "terrible"
	}
}

function calculateScore(home, breakpoints) {
	let element = home[Mavo.toNode].element;
	let score = 0;
	let analysis = [];

	let weights = {address: 1, commute: 1};

	for (let breakpoint of breakpoints) {
		let {feature, weight} = breakpoint;

		let prop = element.querySelector(`[title="${feature}"], [property="${feature.toLowerCase()}"]`);
		let propName = prop.getAttribute("property") || prop.firstElementChild.getAttribute("property");


		weights[propName] = weight;
	}

	for (let propName in weights) {
		let weight = weights[propName];
		let property = element.querySelector(`[property="${propName}"]`);

		let wrapper = property.closest(".basic-info > div");

		if (!wrapper) {
			console.log(`Skipping ${propName}`)
			continue;
		}

		let classification = wrapper.className;
		let index = allClasses.indexOf(classification);

		if (index === -1) {
			continue;
		}

		let factor = -index + 2; // Convert 0 to 4 --> +2 to -2
		// console.log(feature + "", factor, classification, +weight);

		if (factor !== 0 && weight !== 0) {
			analysis.push(`${factor} × ${weight} (${propName})`);
		}


		score += factor * weight;
	}

	return {score, analysis: analysis.join(" + ")};
}