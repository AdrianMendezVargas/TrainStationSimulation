'use strict';

let randomPeopleInterval;
let trainMovementInterval;
let trainRotation = 0;

let train;

const config = {
	trainCapacity: 150,
	ticketPrice: 25,
	running: false,
	alwaysShowTooltips: false
}

let trainStops = []

let estate = {
	RejectedPeople: 0,
	PeopleInTrain: 0,
	PeopleWaitingTrain: 0,
	Income: 0,
	PassengersHistory: []
}

let endReport = {
	MensPassengers: 0,
	KidsPassengers: 0,
	WomensPassengers: 0,
	PregnantWomensPassengers: 0,
	PeopleWithoutVaccineCard: 0,
	RejectedPeople: 0
}

class TrainStop{
	constructor(name, number, id) {
		this.Id = id
		this.StationName = name
		this.Number = number
		this.WaitingLine = []
		this.ExitLine = []
		this.PeopleRejected = []
		this.capacity = 10
	}

	addPerson(person) {
		if (this.WaitingLine.length >= this.capacity) {
			return
		}

		if (!person.HasVaccineCard && person.Kind != 'kid' && person.Kind != 'pregnant' ) {
			this.PeopleRejected.push(person);
			estate.RejectedPeople++
			return
		}

		if (person.Kind == 'pregnant') {
			this.WaitingLine.unshift(person)
		} else {
			this.WaitingLine.push(person)
		}
		let trainStop = document.getElementById(this.Id)
		let waitingLine = trainStop.querySelector('.waitingLine');

		let personElement = document.createElement('div')
		personElement.classList.add('person', 'person-' + person.Kind)
		personElement.id = person.Id;

		if (person.Kind == 'pregnant') {
			waitingLine.insertAdjacentElement('beforeend', personElement)
		} else {
			waitingLine.insertAdjacentElement('afterbegin', personElement)
		}
	}

	addExitingPerson(person) {
		this.ExitLine.push(person)
		let trainStop = document.getElementById(this.Id)
		let exitLineElement = trainStop.querySelector('.exitLine');

		let personElement = document.createElement('div')
		personElement.classList.add('person', 'person-' + person.Kind)
		personElement.id = person.Id;

		exitLineElement.insertAdjacentElement('afterbegin', personElement)
	}

	async beginExitAnimation() {
		let trainStop = document.getElementById(this.Id)
		let exitLineElement = trainStop.querySelector('.exitLine');

		exitLineElement.classList.add('exiting');
		await sleep(7000)
		exitLineElement.classList.remove('exiting');
		
		exitLineElement.innerHTML = ''
		this.ExitLine = []
	}

	ShiftFromWaitingLine() {
		let boardingPassenger = this.WaitingLine.shift()
		if (boardingPassenger) {
			let personElement = document.getElementById(boardingPassenger.Id);
			personElement.remove()
		}
		
		return boardingPassenger
	}
}

class Person{
	constructor(kind, hasVaccineVard, id) {
		this.Id = id
		this.Kind = kind
		this.HasVaccineCard = hasVaccineVard
	}
}

class Train{
	constructor(capacity) {
		this.Capacity = capacity
		this.Passengers = []
		this.TrainStopNumber = 1
	}

	addPassenger(person) {
		if (this.Passengers.length >= this.capacity || !person)  {
			return
		}

		this.Passengers.push(person)
		estate.PassengersHistory.push(person)

		estate.PeopleInTrain++
		estate.Income += config.ticketPrice
	}

	async moveToNextStop() {
		var train = document.querySelector('.train')

		train.style.transform = `rotate(${(120 + trainRotation) * -1}deg)`
		trainRotation += 120;

		await sleep(5000)

		this.TrainStopNumber < 3
			? this.TrainStopNumber++
			: this.TrainStopNumber = 1
		
		await sleep(4500)
		
		getRandomPassengersOffTrain()
		putPassengersOnBoard()
	}

	ShiftPassenger() {
		let exitingPassenger = this.Passengers.shift()

		if (exitingPassenger) {

			let trainStop = trainStops[this.TrainStopNumber - 1]
			trainStop.addExitingPerson(exitingPassenger)

			estate.PeopleInTrain--
		}

		return exitingPassenger
	}
}






const peopleInTrainLabel = document.querySelector('#peopleInTrain');
const peopleWaitingTrainLabel = document.querySelector('#peopleWaitingTrain');
const peopleRejectedLabel = document.querySelector('#peopleRejected');
const incomeLabel = document.querySelector('#income');

const totalPassengersLabel = document.querySelector('#totalPassengers');
const totalMenPassengersLabel = document.querySelector('#totalMenPassengers');
const totalWomenPassengersLabel = document.querySelector('#totalWomenPassengers');
const totalPregnantPassengersLabel = document.querySelector('#totalPregnantPassengers');
const totalKidPassengersLabel = document.querySelector('#totalKidPassengers');

function HandleStartClick() {
	main()
}

function HandleTootipsCheck() {
	config.alwaysShowTooltips = !config.alwaysShowTooltips
}

function main() {
	enableToolTips()
	initializeTrainStops()
	initRandomPeopleInterval()
	initTrain()
	train.moveToNextStop()
	updateIndicators()
}


function initTrain() {
	train = new Train(config.trainCapacity)
}



function updateIndicators() {

	peopleInTrainLabel.innerHTML = estate.PeopleInTrain

	let peopleWaiting = 0
	trainStops.forEach(trainStop => {
		trainStop.WaitingLine.forEach(person => {
			peopleWaiting++
		});

		//Todo: set tooptip
		let trainStopElement = document.getElementById(trainStop.Id);
		trainStopElement.title = `<strong>${trainStop.StationName}</strong>`
		trainStopElement.title += `<br><span><strong>Personas en fila: </strong>${trainStop.WaitingLine.length}</span>`;
		trainStopElement.title += `<br><span><strong>Personas rechazadas: </strong>${trainStop.PeopleRejected.length}</span>`;

		var tooltip = bootstrap.Tooltip.getInstance(trainStopElement)
		tooltip.dispose();

		var newTooltip = new bootstrap.Tooltip(trainStopElement)
		if (config.alwaysShowTooltips) {
			newTooltip.show()
		}
	});

	peopleWaitingTrainLabel.innerHTML = peopleWaiting
	peopleRejectedLabel.innerHTML = estate.RejectedPeople
	incomeLabel.innerHTML = estate.Income

	let totalMens = 0
	let totalPregnants = 0
	let totalWomens = 0
	let totalKids = 0
	estate.PassengersHistory.forEach(passenger => {
		if (passenger.Kind === 'pregnant') {
			totalPregnants++
			totalWomens++
		} else if (passenger.Kind === 'kid') {
			totalKids++
		} else if (passenger.Kind === 'men') {
			totalMens++
		} else{
			totalWomens++
		}
	});

	totalMenPassengersLabel.innerHTML = totalMens;
	totalWomenPassengersLabel.innerHTML = totalWomens;
	totalPregnantPassengersLabel.innerHTML = totalPregnants;
	totalKidPassengersLabel.innerHTML = totalKids;

	totalPassengersLabel.innerHTML = estate.PassengersHistory.length
}

function enableToolTips() {
	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl)
	})
}

function disposeAllTooltips() {
	let toolTips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	toolTips.forEach(ttp => {
		var tooltip = new bootstrap.Tooltip().dispose()
	});
}

function putPassengersOnBoard() {
	let trainStop = trainStops[train.TrainStopNumber - 1]

	let totalPersons = trainStop.WaitingLine.length
	for (let i = 0; i <= totalPersons; i++) {
		if (train.Passengers.length >= train.Capacity) {
			break
		}
		train.addPassenger(trainStop.ShiftFromWaitingLine())
	}

	train.moveToNextStop()
	updateIndicators()
}

function getRandomPassengersOffTrain() {
	train.Passengers.forEach(passenger => {
		let willExit = Math.random() > 0.5
		if (willExit) {
			train.ShiftPassenger()
		}
	});

	let trainstop = trainStops[train.TrainStopNumber - 1]
	trainstop.beginExitAnimation()
}

function initRandomPeopleInterval() {
	randomPeopleInterval = setInterval(() => {
		gererateRandomPeople()
	}, 5000);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


function gererateRandomPeople() {
	let amount = randomIntFromInterval(1, 5)

	for (let i = 0; i < amount; i++) {
		let trainStopNumber = randomIntFromInterval(0, 2)
		let person = generateRandomPerson()
		trainStops[trainStopNumber].addPerson(person)
	}
	updateIndicators()
}

function randomIntFromInterval(min, max) { 
	return Math.floor(Math.random() * (max - min + 1) + min)
}


function generateRandomPerson() {
	let kind = getRandomKindOfPerson()
	let hasVaccineVard = Math.random() < 0.7
	const personId = crypto.randomUUID()
	let person = new Person(kind, hasVaccineVard, personId);
	return person
}

function getRandomKindOfPerson() {
	let isMale = Math.random() < 0.60
	let isKid = Math.random() < 0.15
	let isPregnant = false

	if (!isMale) {
		isPregnant = Math.random() < 0.15
	}

	if (isPregnant) {
		return 'pregnant'
	}else if (isKid) {
		return 'kid'
	}else if (isMale) {
		return 'men'
	} else {
		return 'women'
	}
}

function initializeTrainStops() {
	let blueStop = new TrainStop('Los Manguios', 1, 'blue-stop')
	trainStops.push(blueStop);

	let yellowStop = new TrainStop('El Control', 2, 'yellow-stop')
	trainStops.push(yellowStop);

	let redStop = new TrainStop('La Mira', 3, 'red-stop')
	trainStops.push(redStop);
}






