const chalk = require('chalk');

module.exports = {
	showHelp: function() {
		var year = new Date().getFullYear();
		var month = new Date().getMonth().toString().padStart(2, '0');
		console.log(`You can specify the following parameters:
		--username=username
		--password=pwd
		--directOnly=true\t(default: true)
		--origin=FLR\t\t(IATA Code or City)
		--destination=BLQ\t(IATA Code or City, default: Everywhere)
		--wholeMonthStart=false\t(default: false)
		--dayStart=6
		--dayEnd=15
		--monthStart=${month}\t\t(default: ${month})
		--wholeMonthEnd=false
		--monthEnd=${month}\t\t(default: ${month})
		--yearStart=${year}\t\t(default: ${year})
		--yearEnd=${year}\t\t(default: ${year})
		--children=2\t\t(default: 0)
		--adults=2\t\t(default: 1)

		node index.js --directOnly=true --origin=PSA --month=08
		`);
	},
	validateInputArguments: function (args) {
		let valid = true;
		if (args['origin'] === undefined) {
			console.log(chalk.bgRed("Please select an airport of departure with --origin, eg. --origin=FLR.\n\n"));
			valid = false;
		}

		if (args['monthStart'] === undefined) {
			console.log(chalk.bgRed('The month need to be a number. Please select a month with --monthStart, eg. --monthStart=06.\n\n'));
			valid = false;
		}

		if (args['dayStart'] === undefined && args['wholeMonthStart'] === undefined) {
			console.log(chalk.bgRed('The day need to be a number. Please select a day with --dayStart, eg. --dayStart=06.\n\n'));
			valid = false;
		}

		if(valid == false)
			throw Error(chalk.bgRed("Invalid input parameters. Specify --h to get some help\n\n"));

	},
	inputClear: async function (page, selector) {
		await page.evaluate(selector => {
			document.querySelector(selector).value = "";
		}, selector);
	},
	fakingUserInteraction: async function (page) {
		await page.evaluate(async () => {
			await new Promise((resolve, reject) => {
				// Click random point
				document.elementFromPoint(10, 20).click();
				function getRandomNumber(min, max) {
					return Math.floor(Math.random() * (max - min)) + min;
				}

				// Mouse move on random element in the page (maybe we can use await mouse.move())
				for (var i = 0; i < getRandomNumber(15, 40); i++) {
					var mouseMoveEvent = document.createEvent("MouseEvents");
					mouseMoveEvent.initMouseEvent(
						"mousemove",
						true, // canBubble
						false, // cancelable
						window, // event's AbstractView : should be window 
						1, // detail : Event's mouse click count 
						getRandomNumber(50, 600), // screenX
						getRandomNumber(50, 600), // screenY
						getRandomNumber(50, 600), // clientX
						getRandomNumber(50, 600), // clientY
						false, // ctrlKey
						false, // altKey
						false, // shiftKey
						false, // metaKey 
						0, // button : 0 = click, 1 = middle button, 2 = right button  
						null // relatedTarget
					);

					document.dispatchEvent(mouseMoveEvent)
				};

				var counter = getRandomNumber(10, 30);
				var iterator = 0;

				// Scrolling down a little bit, smootly
				var timer = setInterval(() => {
					window.scrollBy(0, getRandomNumber(40, 100));
					iterator++;
					if (iterator >= counter) {
						clearInterval(timer);
						resolve();
					}
				}, 300);
			});
		});
	},
	setDatepicker: async function (page, wholeMonth, day, month, year) {
		if (wholeMonth !== false) {
			await page.click('[class*="FlightDatepicker"] li:nth-of-type(2) button');
			await page.click('button[class*="Monthselector_monthselector__month"]:nth-of-type(' + (parseInt(month) + 1) + ')');
			console.log(chalk.blue("Selected the ${month} month"));
		} else {
			var year = year || new Date().getFullYear();
			var month = month.padStart(2, '0') || new Date().getMonth().toString().padStart(2, '0');

			if (year != new Date().getFullYear() || month != new Date().getMonth().toString().padStart(2, '0'))
				await page.select('select[name="months"]', `${year}-${month}`);

			await page.evaluate(day => {
				document.querySelectorAll('[class*="BpkCalendarDate_bpk-calendar-date"]:not([class*="BpkCalendarDate_bpk-calendar-date--outside"])')[(parseInt(day) - 1)].click(); // 16 Agosot
			}, day);
			await page.screenshot({ path: 'screen/datepicker.png' });

		}
	},
	getRoutesData: async function (page) {
		await page.waitForSelector('.day-list-item div article.result');
		return await page.evaluate(() => {
			var results = [];

			var tickets = document.querySelectorAll('.day-list-item div article.result');
			for (let i = 0; i < tickets.length; i++) {
				var departureNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-depart"]');
				var durationNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-stops-3lHev"]');
				var arrivalNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-arrive"]');
				var price = tickets[i].querySelector('.price').innerText;

				var tempObj = {
					routes: [],
					price: price
				};

				for (let j = 0; j < departureNodes.length; j++) {
					tempObj['routes'].push({
						departure: departureNodes[j].innerText.replace(/\n/, ' '),
						duration: durationNodes[j].innerText.replace(/\n/, ' '),
						destination: arrivalNodes[j].innerText.replace(/\n/, ' ')
					});
				}
				results.push(tempObj);
			}

			return JSON.stringify(results);
		});
	},
	clickOnRecaptcha: async function (page) {
		var frame = await page.frames()[2];
		await frame.evaluate(() => {
			document.querySelectorAll('.recaptcha-checkbox')[0].click();
		}).catch((err) => console.log(chalk.yellow('captcha not found')));
	}
};