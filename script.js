const latestData = '06-04-2024';

const SortOrder = {
	Ascending: 'Ascending',
	Descending: 'Descending',
};

const green = [80, 200, 100];
const red = [200, 100, 80];
let db = null;
let activeSorts = [];
let priceRange = {};
let unitPriceRange = {};
let capacityRange = {};
let mlperRange = {};
let scoreRange = {};

const closeNav = () => {
	document.getElementById("sidenav").style.left = "-100%";
}

const openNav = () => {
	document.getElementById("sidenav").style.left = "0";
}

const clearSorts = () => {
	activeSorts = [];
	render();
}

const updateActiveSorts = (sortColumn) => {
	const index = activeSorts.map(e => e.column).indexOf(sortColumn);

	if (index != -1) {
		if (activeSorts[index].order == SortOrder.Ascending) {
			activeSorts[index] = { column: sortColumn, order: SortOrder.Descending }
		} else {
			activeSorts.splice(index, 1);
		}
	} else {
		activeSorts.push({ column: sortColumn, order: SortOrder.Ascending });
	}

	render();
}

const getData = async () => {
	// let response = await fetch(latestData + '.json');
	// console.log("data loaded");
	// return response.json();

	const url = `https://api.github.com/repos/wnsty/wnsty.github.io/contents/data`;
	const response = await fetch(url);
	const files = await response.json();
	const jsonFiles = files
		.filter(file => file.name.endsWith('.json'))
		.sort((a, b) => new Date(b.name.split(".")[0] - new Date(a.name.split(".")[0])))
	
	if (jsonFiles.length === 0) {
		console.error("no JSON files found");
		return [];
	}

	const latestUrl = jsonFiles[0].download_url;
	const latestResponse = await fetch(latestUrl);
	return await latestResponse.json();
}

window.onload = async (event) => {
	db = await getData();
	setWaistRange(db);
	setSliderRange(db, "price");
	setSliderRange(db, "units");
	setSliderRange(db, "capacity");
	setSliderRange(db, "unit_price");
	setSliderRange(db, "ml_per_unit_price");
	setSliderRange(db, "value");
	render();
}

const setWaistRange = (data) => {
	const max = Math.round(maxValue(data, "waist_high"));
	const min = Math.round(minValue(data, "waist_low"));
	const waist = document.getElementById("waist");
	waist.setAttribute("max", max);
	waist.setAttribute("min", min);
	waist.value = max / 2;
}

const maxValue = (data, field) => {
	let value = 0;
	for (const product of data) {
		if (product[field] > value) {
			value = product[field];
		}
	}
	return value;
}

const minValue = (data, field) => {
	let value = Infinity;
	for (const product of data) {
		if (product[field] < value && product[field] != 0) {
			value = product[field];
		}
	}
	return value;
}

const setSliderRange = (data, id) => {
	const max = Math.round(maxValue(data, id))
	const sliderMax = document.getElementById(id + "-max");
	const sliderMin = document.getElementById(id + "-min");
	sliderMax.setAttribute("max", max);
	sliderMin.setAttribute("max", max);
	sliderMax.value = max;
}

const render = () => {
	renderHeaders();
	clear();

	const filters = getFilters();
	const filteredData = filterData(db, filters);
	const sortedData = sortData(filteredData);

	updateRanges(sortedData);

	const tbody = document.getElementById("tbody");
	for (const product of sortedData) {
		tbody.appendChild(createRow(product));
	}
}

const updateRanges = (sortedData) => {
	const sortedPrice = sortedData.map(p => p.price);
	priceRange.min = Math.min(...sortedPrice);
	priceRange.max = Math.max(...sortedPrice);

	const sortedUnitPrice = sortedData.map(p => p.unit_price);
	unitPriceRange.min = Math.min(...sortedUnitPrice);
	unitPriceRange.max = Math.max(...sortedUnitPrice);

	const sortedCapacity = sortedData.map(p => p.capacity);
	capacityRange.min = Math.min(...sortedCapacity);
	capacityRange.max = Math.max(...sortedCapacity);

	const sortedMlPer = sortedData.map(p => p.ml_per_unit_price);
	mlperRange.min = Math.min(...sortedMlPer);
	mlperRange.max = Math.max(...sortedMlPer);

	const sortedScore = sortedData.map(p => p.value);
	scoreRange.min = Math.min(...sortedScore);
	scoreRange.max = Math.max(...sortedScore);
}

const renderHeaders = () => {
	for (const arrow of document.getElementsByClassName("sort-arrow")) {
		arrow.innerText = '⮞';
	}

	let i = activeSorts.length + 1;
	for (const sort of activeSorts) {
		i--;
		const th = document.getElementById(sort.column + "-th");
		if (sort.order == SortOrder.Ascending) {
			th.innerText = '⮟' + ' ' + i;
		} else {
			th.innerText = '⮝' + ' ' + i;
		}
	}
}

const clear = () => {
	const table = document.getElementById("tbody");
	while (table.firstChild) {
		table.removeChild(table.lastChild);
	}
}

const getFilters = () => {
	return {
		waist: document.getElementById("waist").value,
		price: getSliderValue("price"),
		units: getSliderValue("units"),
		capacity: getSliderValue("capacity"),
		unitPrice: getSliderValue("unit_price"),
		MLUnitPrice: getSliderValue("ml_per_unit_price"),
		score: getSliderValue("value"),
		tapes2: document.getElementById("tapes-2").checked,
		tapes4: document.getElementById("tapes-4").checked,
		plastic: document.getElementById("plastic-backing").checked,
		cloth: document.getElementById("cloth-backing").checked,
		inStock: document.getElementById("in-stock").checked,
		anySize: document.getElementById("any-size").checked,
	};
}

const getSliderValue = (id) => {
	return {
		min: document.getElementById(id + "-min").value,
		max: document.getElementById(id + "-max").value
	}
}

const filterData = (data, filters) => {
	return data.filter((product) => {
		return (
			(matchesWaist(product, filters)) &&
			(matchesRangeFilter(product.price, filters.price)) &&
			(matchesRangeFilter(product.units, filters.units)) &&
			(matchesRangeFilter(product.capacity, filters.capacity)) &&
			(matchesRangeFilter(product.unit_price, filters.unitPrice)) &&
			(matchesRangeFilter(product.ml_per_unit_price, filters.MLUnitPrice)) &&
			(matchesRangeFilter(product.value, filters.score)) &&
			((filters.tapes2 && product.tapes == 2) || (filters.tapes4 && product.tapes == 4)) &&
			((filters.plastic && product.backing == "Plastic") || (filters.cloth && product.backing == "Cloth")) &&
			(!filters.inStock || (product.in_stock == "Yes" || product.in_stock == "Maybe"))
		);
	});
}

const matchesWaist = (product, filters) => {
	if (filters.anySize) {
		return true;
	}
	return ((filters.waist <= product.waist_high) &&
		(filters.waist >= product.waist_low));
}

const matchesRangeFilter = (item, filter) => {
	return item <= filter.max && item >= filter.min;
}

const sortData = (data) => {
	for (const sort of activeSorts) {
		const [column, order] = [sort.column, sort.order];
		if (order === SortOrder.Ascending) {
			data = sortAscending(data, column);
		} else {
			data = sortDescending(data, column);
		}
	}
	return data;
}

const sortAscending = (data, column) => {
	return data.sort((a, b) => {
		switch (typeof (a[column])) {
			case 'number':
				return b[column] - a[column];
			case 'string':
				return a[column].localeCompare(b[column]);
			case 'boolean':
				return b[column] - a[column];
		}
	});
}

const sortDescending = (data, column) => {
	return data.sort((a, b) => {
		switch (typeof (a[column])) {
			case 'number':
				return a[column] - b[column];
			case 'string':
				return b[column].localeCompare(a[column]);
			case 'boolean':
				return a[column] - b[column];
		}
	});
}

const createRow = (product) => {
	const tr = document.createElement('tr');
	createDataCell(tr, product.brand);
	createDataCell(tr, product.name);
	createDataCell(tr, product.size);
	createDataCell(tr, product.waist_low + " - " + product.waist_high);
	createDataCell(tr, product.units);
	createDataCell(tr, moneyFormatter.format(product.price), getColor(product.price, priceRange));
	createDataCell(tr, moneyFormatter.format(product.unit_price), getColor(product.unit_price, unitPriceRange, true));
	createDataCell(tr, product.capacity, getColor(product.capacity, capacityRange));
	createDataCell(tr, Math.round(product.ml_per_unit_price), getColor(product.ml_per_unit_price, mlperRange));
	createDataCell(tr, Math.round(product.value), getColor(product.value, scoreRange));
	createDataCell(tr, product.in_stock);
	createDataCell(tr, product.notes);
	createDataCell(tr, product.backing);
	createDataCell(tr, product.tapes);
	createLink(tr, product.url);
	return tr;
}

const getColor = (value, range, invert = false) => {
	if (invert) {
		return interpolateColor(green, red, percentage(value, range))
	}
	return interpolateColor(red, green, percentage(value, range))
} 

const createDataCell = (tr, innerText, color = null) => {
	const td = document.createElement('td');
	td.innerText = innerText;
	if (color != null) {
		td.style.backgroundColor = rgbString(color);
	}
	tr.appendChild(td);
}

const interpolateColor = (color1, color2, percentage) => {
	const r = Math.round(interpolate(color1[0], color2[0], percentage));
	const g = Math.round(interpolate(color1[1], color2[1], percentage));
	const b = Math.round(interpolate(color1[2], color2[2], percentage));
	return [r, g, b];
}

const interpolate = (value1, value2, percentage) => {
	return value1 * (1 - percentage) + value2 * percentage;
}

const rgbString = (color) => {
	return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

const percentage = (value, range) => {
	return (value - range.min) / (range.max - range.min)
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: "USD",
});

const createLink = (tr, innerText) => {
	const td = document.createElement('td');
	const a = document.createElement('a');
	a.innerHTML = "View Page";
	a.setAttribute("href", innerText);
	td.appendChild(a);
	tr.appendChild(td);
}