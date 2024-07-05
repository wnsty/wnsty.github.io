const formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
})

let data = getJson()
let enabledSorts = []
let sizes = {
	'XSmall': 0,
	'Small': 1,
	'SMedium': 2,
	'Medium': 3,
	'Large': 4,
	'XLarge': 5,
	'XXLarge': 6,
	'XXXLarge': 7,
}

async function getJson() {
	let response = await fetch('latest.json');
	return response.json();
}

function modifySorts(column) {
	let sortIndex = enabledSorts.map(e => e.column).indexOf(column);

	if (sortIndex != -1) {
		if (enabledSorts[sortIndex].inverted) {
			enabledSorts.splice(sortIndex, 1);
		} else {
			enabledSorts[sortIndex] = {inverted: true, column};
		}
	} else {
		enabledSorts.push({inverted: false, column});
	}

	update()
}

function checkWaist(waist_low, waist_high) {
	waist_low = Number(waist_low)
	waist_high = Number(waist_high)
	let waist = document.getElementById('waist');
	if (waist === null) {
		console.log("waist is null");
		return true;
	}
	return waist.value >= waist_low && waist.value <= waist_high;
}

function sortJson(json) {
	enabledSorts.forEach(enabledSort => {
		let column = enabledSort.column
		json.sort((a, b) => {
			if (typeof(a[column]) === 'number') {
				return b[column] - a[column];
			} else if (typeof(a[column]) === 'string') {
				return a[column].localeCompare(b[column]);
			} else if (typeof(a[column]) === 'boolean') {
				return b[column] - a[column];
			}
		});
		if (enabledSort.inverted) {
			json.reverse();
		}
	});
	return json;
}

function checkStock(in_stock) {
	let only_in_stock = document.getElementById('in_stock');
	if (only_in_stock === null) {
		console.log("only_in_stock is null");
		return true;
	}
	if (in_stock === 'Maybe' || in_stock === 'Yes') {
		return true;
	} else if (in_stock === 'No') {
		return !only_in_stock.checked;
	}
}

function checkBudget(price) {
	price = Number(price)
	let min_budget = document.getElementById('min_budget');
	if (min_budget === null) {
		console.log("min_budget is null");
		return true;
	}
	let max_budget = document.getElementById('max_budget');
	if (max_budget === null) {
		console.log("max_budget is null");
		return true;
	}
	return price <= max_budget.value && price >= min_budget.value;
}	

function checkCapacity(capacity) {
	let min_capacity = document.getElementById('min_capacity');
	if (min_capacity === null) {
		console.log("min_capacity is null");
		return true;
	}
	let max_capacity = document.getElementById('max_capacity');
	if (max_capacity === null) {
		console.log("max_capacity is null");
		return true;
	}
	return capacity >= min_capacity.value && capacity <= max_capacity.value;
}

function checkOption(option, preferred_option) {
	if (preferred_option === 'both') {
		return true;
	} else {
		return option === preferred_option;
	}
}

function checkBacking(backing) {
	let preferred_backing = document.getElementById('backing');
	if (preferred_backing === null) {
		console.log("preferred_backing is null");
		return true;
	}
	return checkOption(String(backing).toLowerCase(), preferred_backing.value);
}

function checkTapes(tapes) {
	return checkOption(String(tapes), document.getElementById('tapes').value);
}

function checkUnitPrice(unit_price) {
	let min_unit_price = document.getElementById('min_unit_price');
	if (min_unit_price === null) {
		console.log("min_unit_price is null");
		return true;
	}
	let max_unit_price = document.getElementById('max_unit_price');
	if (max_unit_price === null) {
		console.log("max_unit_price is null");
		return true;
	}
	return unit_price <= max_unit_price.value && unit_price >= min_unit_price.value;
}

function checkMLPerUnitPrice(ml_per_unit_price) {
	let min_ml_per_unit_price = document.getElementById('min_ml_per_unit_price');
	if (min_ml_per_unit_price === null) {
		console.log("min_ml_per_unit_price is null");
		return true;
	}
	let max_ml_per_unit_price = document.getElementById('max_ml_per_unit_price');
	if (max_ml_per_unit_price === null) {
		console.log("max_ml_per_unit_price is null");
		return true;
	}
	return ml_per_unit_price <= max_ml_per_unit_price.value && ml_per_unit_price >= min_ml_per_unit_price.value;
}

function checkFiltered() {
	let show_all = document.getElementById('show_all')
	if (show_all === null) {
		return false;
	}
	return !show_all.checked;
}

function filterJson(json) {
	let result = {};
	if (checkFiltered()) {
		result = json.filter(row => {
			return checkWaist(row.waist_low, row.waist_high)
			&& checkStock(row.in_stock)
			&& checkBudget(row.price)
			&& checkCapacity(row.capacity)
			&& checkBacking(row.backing)
			&& checkTapes(row.tapes)
			&& checkUnitPrice(row.unit_price)
			&& checkMLPerUnitPrice(row.ml_per_unit_price);
		});
	} else {
		result = json;
	}
	console.log(`Displaying ${result.length} results`);
	return result;
}

function addText(innerText) {
	let entry = document.createElement('td');
	entry.innerText = innerText;
	return entry;
}

function addMoney(innerText) {
	let entry = document.createElement('td');
	entry.innerText = formatter.format(innerText);
	return entry;
}

function addLink(innerText) {
	let entry = document.createElement('td');
	let a = document.createElement('a');
	a.innerText = "Here!";
	a.setAttribute('href', innerText);
	entry.appendChild(a);
	return entry;
}

function interpolate_color(color1, color2, percentage) {
	const r = Math.round(interpolate(color1[0], color2[0], percentage));
	const g = Math.round(interpolate(color1[1], color2[1], percentage));
	const b = Math.round(interpolate(color1[2], color2[2], percentage));
	return [r, g, b];
}

function interpolate(value1, value2, percentage) {
	return value1 * (1 - percentage) + value2 * percentage;
}

function rgb_string(color) {
	return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

async function render(json) {
	const green = [87, 187, 138];
	const red = [230, 124, 115];
	let tbody = document.getElementById('tbody');
	while (tbody.firstChild) {
		tbody.removeChild(tbody.firstChild);
	}
	const max_price = Math.max(...Object.values(json).map(obj => obj.price));
	const min_price = Math.min(...Object.values(json).map(obj => obj.price));
	const max_unit_price = Math.max(...Object.values(json).map(obj => obj.unit_price));
	const min_unit_price = Math.min(...Object.values(json).map(obj => obj.unit_price));
	const min_capacity = Math.min(...Object.values(json).map(obj => obj.capacity));
	const max_capacity = Math.max(...Object.values(json).map(obj => obj.capacity));
	const min_ml_per_unit_price = Math.min(...Object.values(json).map(obj => obj.ml_per_unit_price));
	const max_ml_per_unit_price = Math.max(...Object.values(json).map(obj => obj.ml_per_unit_price));
	for (const [_, row] of json.entries()) {
		let tr = document.createElement('tr');
		tr.appendChild(addText(row.retailer));
		tr.appendChild(addText(row.brand));
		tr.appendChild(addText(row.name));
		tr.appendChild(addText(row.backing));
		tr.appendChild(addText(row.tapes));
		// size_element.setAttribute("bgColor", "red");
		tr.appendChild(addText(row.size));
		tr.appendChild(addText(row.waist_low + " - " + row.waist_high));
		// tr.appendChild(addText(row.waist_high));
		// tr.appendChild(addMoney(row.price));
		// tr.appendChild(addText(row.shipping));

		const price_element = addMoney(row.price);
		const price_color = interpolate_color(green, red, (row.price - min_price) / (max_price - min_price));
		price_element.style.backgroundColor = rgb_string(price_color);
		tr.appendChild(price_element);
		tr.appendChild(addText(row.units));
		const unit_price_element = addMoney(row.unit_price);
		const unit_price_color = interpolate_color(green, red, (row.unit_price - min_unit_price) / (max_unit_price - min_unit_price));
		unit_price_element.style.backgroundColor = rgb_string(unit_price_color);
		tr.appendChild(unit_price_element);
		const capacity_element = addText(row.capacity);
		const capacity_color = interpolate_color(red, green,  (row.capacity - min_capacity) / (max_capacity - min_capacity));
		capacity_element.style.backgroundColor = rgb_string(capacity_color);
		tr.appendChild(capacity_element);
		const ml_per_unit_price_element = addText(row.ml_per_unit_price);
		const ml_per_unit_price_color = interpolate_color(red, green, (row.ml_per_unit_price - min_ml_per_unit_price) / (max_ml_per_unit_price - min_ml_per_unit_price));
		ml_per_unit_price_element.style.backgroundColor = rgb_string(ml_per_unit_price_color);
		tr.appendChild(ml_per_unit_price_element);
		tr.appendChild(addText(row.in_stock));
		// TODO: fix notes
		tr.appendChild(addText(""));
		tr.appendChild(addLink(row.url));
		tbody.appendChild(tr);
	}
}

async function main() {
	render(filterJson(sortJson(await data)));
}

async function update() {
	render(filterJson(sortJson(await data)));
}

async function update_waist(is_max) {
	// let link_waist = document.getElementById('link_waist');
	// if (link_waist === null) {
	// 	console.log("link waist is null");
	// 	return;
	// }
	// if (link_waist.checked) {
	// 	let max_waist = document.getElementById('max_waist');
	// 	let min_waist = document.getElementById('min_waist');
	// 	if (is_max) {
	// 		min_waist.value = max_waist.value;
	// 	} else {
	// 		max_waist.value = min_waist.value;
	// 	}
	// }
	update();
}

function toggle(targets) {
	for (let target of targets) {
		switch(target.innerText) {
			case 'remove':
				target.innerText = 'expand_more';
				break;
			case 'expand_more':
				target.innerText = 'expand_less';
				break;
			case 'expand_less':
				target.innerText = 'remove';
				break;
		}
	}
}

document.getElementById('retailer_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons retailer_icon'));});
document.getElementById('brand_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons brand_icon'));});
document.getElementById('name_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons name_icon'));});
document.getElementById('backing_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons backing_icon'));});
document.getElementById('tapes_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons tapes_icon'));});
document.getElementById('size_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons size_icon'));});
document.getElementById('waist_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons waist_icon'));});
// document.getElementById('waist_high_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons waist_high_icon'));});
// document.getElementById('price_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons price_icon'));});
// document.getElementById('shipping_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons shipping_icon'));});
document.getElementById('price_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons price_icon'));});
document.getElementById('units_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons units_icon'));});
document.getElementById('unit_price_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons unit_price_icon'));});
document.getElementById('capacity_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons capacity_icon'));});
document.getElementById('ml_per_unit_price_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons ml_per_unit_price_icon'));});
document.getElementById('in_stock_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons in_stock_icon'));});
document.getElementById('notes_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons notes_icon'));});
document.getElementById('url_th').addEventListener('click', e => {toggle(document.getElementsByClassName('material-icons url_icon'));});

main();