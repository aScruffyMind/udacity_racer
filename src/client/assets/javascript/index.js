// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	racers: undefined,
	race: undefined
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad();
	setupClickHandlers();
});

// This function executes once the page has finished loading.
async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks);			
				renderAt('#tracks', html);
			});
		getRacers()
			.then((racers) => { 
				const html = renderRacerCars(racers);
				store.racers = racers;
				renderAt('#racers', html);
			});
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

// this function handles elements on the page that are clicked.
function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event;
		// Race track form field
		if (target.matches('.card.track') || target.matches('.card.track > h3')) { 
			if (target.tagName === 'H3') {
				handleSelectTrack(target.parentElement);
			} else {
				handleSelectTrack(target);
			}
		}
		// Podracer form field
		if (target.matches('.card.podracer') || target.matches('.card.podracer > h3, p')) { 					
			if (target.tagName === 'H3' || target.tagName === 'P') {
				handleSelectPodRacer(target.parentElement);			
			} else {
				handleSelectPodRacer(target);
			}
		}
		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault();
			handleCreateRace();
		}
		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target);
		}
	}, false);
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race
async function handleCreateRace() {
	renderAt('#race', renderRaceStartView(store.track_id, racers)); 
	// TODO - Get player_id and track_id from the store
	const { player_id, track_id } = store;
	// TODO - invoke the API call to create the race, then save the result
	try {
		const countdownTimer = Number(document.getElementById('big-numbers').innerText);
		const theRace = await createRace(store.player_id, store.track_id);
		store.race_id = theRace.ID - 1;
		store.race = theRace;
		// TODO - call the async function runCountdown
		await runCountdown();		
	} catch(error) {
		console.log(`Error! Error! ${error}`);
	}
	// TODO - call the async function startRace
	await startRace(store.race_id);
	// TODO - call the async function runRace
	await runRace(store.race_id);
}

function runRace(raceID) {
	return new Promise(resolve => {
		// TODO - use Javascript's built in setInterval method to get race info every 500ms
		const raceInterval = setInterval(() => {
		try {
			fetch(`${SERVER}/api/races/${store.race_id}`)
				.then(res => res.json())
				.then(res => {
					/* 
						TODO - if the race info status property is "in-progress", update the leaderboard by calling:
						renderAt('#leaderBoard', raceProgress(res.positions))
					*/				
					if (res.status === 'in-progress') {				
						renderAt('#leaderBoard', raceProgress(res.positions));
					}
					if (res.status === 'finished') {					
						clearInterval(raceInterval);
						renderAt('#race', resultsView(res.positions));
						resolve(res);
					}
				})
		} catch (error) {
			console.log(`There was a problem here: ${error}`);
		}	
		}, 500);
	});
}

async function runCountdown() {
	try {
		let bigNumbers = document.getElementById('big-numbers');
		let timer = 3;

		return new Promise(resolve => {
			// TODO - use Javascript's built in setInterval method to count down once per second
			const tock = () => {
				if (timer != 1) {
					bigNumbers.innerHTML = --timer;
				} else {
					// TODO - if the countdown is done, clear the interval, resolve the promise, and return
					clearInterval(tick);
					bigNumbers.innerHTML = 'GO!';
					resolve(true);
				}
			};
			// run this DOM manipulation to decrement the countdown for the user
			const tick = setInterval(tock, 1000); 
		});
	} catch(error) {
		console.log(error);
	}
}

// This function marks the selected racer on the page and adds the racer to the store.
function handleSelectPodRacer(target) {
	const selected = document.querySelector('#racers .selected');
	if(selected) {
		selected.classList.remove('selected');
	}
	// add class 'selected' to current target
	target.classList.add('selected');
	// TODO - save the selected racer to the store 
	store.player_id = Number(target.id);
}

// this function makes the selected track appear selected, and adds track ID to the store.
function handleSelectTrack(target) {
	// remove class 'selected' from all track options
	const selected = document.querySelector('#tracks .selected');
	if(selected) {
		selected.classList.remove('selected');
	}
	// add class 'selected' to current target
	target.classList.add('selected');
	// TODO - save the selected track id to the store
	store.track_id = Number(target.id);
}

function handleAccelerate() {
	// TODO - Invoke the API call to accelerate
	accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

// this function creates and returns the HTML code for the racer cards.
function renderRacerCars(racers) {
	if (!racers.length) { // if there are no racers to display, return an HTML placeholder 
		return `
			<h4>Loading Racers...</4>
		`;
	}
	
	// the 'results' variable is a mapped array of racer cards (HTML) that are then joined together as one string.
	const results = racers.map(renderRacerCard).join(''); 
	
	// The track cards are then returned inside a parent element (ul)
	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;

	return `
		<li class="card podracer" id="${id}">
			<h3>Driver: ${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`;
}

// this function creates and returns the HTML code for the track cards.
function renderTrackCards(tracks) {
	// tracks is an array of objects containing track information
	if (!tracks.length) { // if there are no tracks to display, return an HTML placeholder
		return `
			<h4>Loading Tracks...</4>
		`;
	}
	
	// the 'results' variable is a mapped array of track cards (HTML) that are then joined together as one string.
	const results = tracks.map(renderTrackCard).join('');
	
	// The track cards are then returned inside a parent element (ul)
	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track; // create variables id and name from individual track object passed in as argument
	
	// return an HTML block for the track card, using the ID and name variables
	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1);

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	// userPlayer is the racer in positions var with the same id as the player_id in the store.
	let userPlayer = positions.find(e => e.id === store.player_id);
	// add "(you)" next to the userPlayer's name when rendering their progress card.
	userPlayer.driver_name += " (you)";

	// sort the positions
	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
	let count = 1;

	// create a block of HTML code (string) of table rows showing racer positions, stored in "results" variable.
	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	// stick the block of HTML code in the middle of the leaderboard and return it.
	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

// this function inserts generated HTML code into an element
function renderAt(element, html) { // arg element is the ID to target, html is the code to insert
	const node = document.querySelector(element);
	node.innerHTML = html;
}
// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------
const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	};
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 
function getTracks() {
	try {
		const trackData = fetch(`${SERVER}/api/tracks`)
		.then(res => res.json());
		return trackData;
	} catch(error) {
		console.log(`getTracks Error: ${error}`);
	}
}

function getRacers() {
	try {
		const racerData = fetch(`${SERVER}/api/cars`)
			.then(res => res.json())
		return racerData;
	} catch (error) {
		console.log(`getRacers Error: ${error}`);
	}
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err));
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	try {
		const race = fetch(`${SERVER}/api/races/${id}`)
		.then(res => res.json());
	} catch(error) {
		console.log(`There was a problem here: ${error}`);
	}
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log("Problem with getRace request::", err))
}

function testRace(id) {
	console.log(startRace(3));
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log('The gas pedal is broken ', err));
}