/* 
 ! CONSTANTS
 */

const days = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
]

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
]

/*
 ! PROJECT FUNCTIONS
 */

const refreshClock = (ampm) => {
	const date = new Date(Date.now());
	let hours = `${date.getHours()}`;
	let minutes = `${date.getMinutes()}`;
	let seconds = `${date.getSeconds()}`;

	hours = hours.length > 1 ? hours : '0' + hours;
	minutes = minutes.length > 1 ? minutes : '0' + minutes;
	seconds = seconds.length > 1 ? seconds : '0' + seconds;

	if (ampm) {
		if (!document.querySelector('.ampm')) {
			const ampm_ = hours >= 12 ? 'PM' : 'AM';

			const span = document.createElement('span')
			span.classList.add('ampm')
			span.textContent = ampm_

			document.querySelector('.clock').insertAdjacentElement('beforeend', span);
		}

		hours = hours % 12;
		hours = hours ? hours : 12;
		hours = hours < 10 ? '0' + hours : hours;
	} else {
		if (document.querySelector('.ampm')) {
			document.querySelector('.ampm').remove();
		}
	}

	const clock = document.querySelector('#clock');
	clock.textContent = `${hours}:${minutes}:${seconds}`;
}

const refreshDate = () => {
	const date = new Date(Date.now());

	const day = date.getDay();
	const num = date.getDate()
	const month = date.getMonth();
	const year = date.getFullYear();

	const dateElement = document.querySelector('.date');
	dateElement.textContent = `${days[day]}, ${months[month]} ${num}, ${year}`;
}

/*
 ? UTILS
 */

const createCookie = (name, value, days) => {
	let expires = "";
	if (days) {
		let date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = `expires=${date.toGMTString()}`;
	}

	document.cookie = `${name}=${value};${expires};path=/`;
}

const getCookie = (name) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
	return undefined;
}

const existCookie = (name) => {
	return getCookie(name) ? true : false;
}

function eraseCookie(name) {
	createCookie(name, "", -1);
}

/*
 ! STARTUP
 */
if (!existCookie('ampm')) {
	createCookie('ampm', 'false', 7)
}

let ampm = getCookie('ampm') === 'true' ? true : false;

if (ampm) {
	document.querySelector('.toggle').classList.add('on');
}

refreshClock(ampm);
refreshDate(ampm);

document.querySelector('.toggle').addEventListener('click', () => {
	document.querySelector('.toggle').classList.toggle('rot');

	ampm = !ampm;
	if (ampm) {
		document.querySelector('.toggle').classList.add('on');
	} else {
		document.querySelector('.toggle').classList.remove('on');
	}

	createCookie('ampm', `${ampm}`, 7);

	refreshClock(ampm);
	refreshDate(ampm);
})

setInterval(() => {
	refreshClock(ampm);
	refreshDate(ampm);
}, 500);