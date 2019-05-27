const puppeteer = require('puppeteer-extra');
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const chalk = require('chalk');

puppeteer.use(pluginStealth());

const args = {
	directOnly: true,
	destination: 'Everywhere',
	wholeMonthStart: false,
	wholeMonthEnd: false,
	oneWay: true
};
process.argv.slice(2).map(function (val) {
		let splitted = val.split('=');
		if(splitted[0].search('--') !== -1)
			args[splitted[0].replace('--', '')] = splitted[1];
	}
);

if(Object.keys(args).indexOf('h') !== -1) {
	var year = new Date().getFullYear();
	var month = new Date().getMonth().toString().padStart(2, '0');
	console.log(`You can specify the following parameters:
	--username=username
	--password=pwd
	--directOnly=true\t(default: true)
	--origin=FLR\t\t(IATA Code)
	--destination=BLQ\t(IATA Code, default: Everywhere)
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
	return false;
}

if(args['monthEnd'] !== undefined) {
	args['oneWay'] = false;
}

if(args['origin'] === undefined) {
	console.log("Please select an airport of departure with --origin, eg. --origin=FLR.\n\nSpecify --h to get some help");
	return false;
}

if(args['monthStart'] === undefined) {
	console.log('The month need to be a number. Please select a month with --monthStart, eg. --monthStart=06.\n\nSpecify --h to get some help');
	return false;
}

if(args['dayStart'] === undefined) {
	console.log('The day need to be a number. Please select a day with --dayStart, eg. --dayStart=06.\n\nSpecify --h to get some help');
	return false;
}

const defaultUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36';

/* da mettere in un file separato */
async function inputClear(page, selector) {
  await page.evaluate(selector => {
    document.querySelector(selector).value = "";
  }, selector);
}

async function setDatepicker(page, wholeMonth, day, month, year) {
	if(wholeMonth !== false) {
		// tutto il mese
		await page.click('[class*="FlightDatepicker"] li:nth-of-type(2) button'); // tutto il mese
		await page.click('button[class*="Monthselector_monthselector__month"]:nth-of-type(' + (parseInt(month)+1) + ')'); // num + 1 (num + 1 = mese attuale)
		console.log("Selected the ${month} month");
	} else {
		var year = year || new Date().getFullYear();
		var month = month || new Date().getMonth().toString().padStart(2, '0');

		if(year != new Date().getFullYear() || month != new Date().getMonth().toString().padStart(2, '0'))  
				await page.select('select[name="months"]', `${year}-${month}`);

		await page.evaluate(day => {
			document.querySelectorAll('[class*="BpkCalendarDate_bpk-calendar-date"]:not([class*="BpkCalendarDate_bpk-calendar-date--outside"])')[(parseInt(day)-1)].click(); // 16 Agosot
		}, day);
		await page.screenshot({path: 'screen/datepicker.png'});

	}
}

async function getRoutesData (page) {
	await page.waitForSelector('.day-list-item div article.result');
	return await page.evaluate(() => {
		var results = [];

		var tickets = document.querySelectorAll('.day-list-item div article.result');
		for(let i = 0; i < tickets.length; i++) {
			var departureNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-depart"]');
			var durationNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-stops-3lHev"]');
			var arrivalNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-arrive"]');
			var price = tickets[i].querySelector('.price').innerText;

			var tempObj = {
				routes: [],
				price: price
			};

			for(let j = 0; j < departureNodes.length; j++) {
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
}

(async () => {
  const browser = await puppeteer.launch({
  	headless: true,
  	defaultViewport: {
  		width: 1600,
  		height: 900
  	}
	});

  const page = await browser.newPage();
  await page.setUserAgent(defaultUA);
  // await page.setJavaScriptEnabled(false);

  console.log('Loading Skyscanner HP');
  await page.goto('https://www.skyscanner.com');
  console.log('Faking user interaction..');

  await page.evaluate(async () => {
	  await new Promise((resolve, reject) => {
	  	// Math.floor(Math.random() * 90)
	  	document.elementFromPoint(10, 20).click();
	  	
	  	for (var i = 0; i < Math.floor(Math.random() * 25) + 15; i++) {
	  		var mouseMoveEvent = document.createEvent("MouseEvents");
				mouseMoveEvent.initMouseEvent(
	         "mousemove",
	         true, // canBubble
	         false, // cancelable
	         window, // event's AbstractView : should be window 
	         1, // detail : Event's mouse click count 
	         (Math.floor(Math.random() * 550) + 50), // screenX
	         (Math.floor(Math.random() * 550) + 50), // screenY
	         (Math.floor(Math.random() * 550) + 50), // clientX
	         (Math.floor(Math.random() * 550) + 50), // clientY
	         false, // ctrlKey
	         false, // altKey
	         false, // shiftKey
	         false, // metaKey 
	         0, // button : 0 = click, 1 = middle button, 2 = right button  
	         null // relatedTarget
				);

				document.dispatchEvent(mouseMoveEvent)
	  	};

	  	var counter = Math.floor(Math.random() * 20) + 10;
	  	var iterator = 0;
      var timer = setInterval(() => {
          window.scrollBy(0, Math.floor(Math.random() * 60) + 40);
          iterator++;
          if(iterator >= counter){
              clearInterval(timer);
              resolve();
          }
      }, 300);
    });
  });

  if(args['username'] !== undefined && args['password'] !== undefined) {
  	console.log('Log in');
  	await page.click('#login-button-nav-item button');
  	await page.waitFor(400);
  	await page.click('[data-testid="login-email-button"]');

  	await page.type('.js-loginEmailInput', args['username']);
  	await page.type('#password', args['password']);

		await page.click('[data-testid="login-button"]');
		console.log('Login succesfully');
  }

  // await page.click('#fsc-trip-type-selector-return'); // andata e ritorno, default
  
  console.log("Is oneWay: " + (args['oneWay']));
  if(args['oneWay'] === true)
  	await page.click('#fsc-trip-type-selector-one-way'); // solo andata

  console.log("Is directOnly: " + (args['directOnly']));
  if(args['directOnly'] === true)
  	await page.click('input[name="directOnly"]'); // solo diretti, default

  await page.click('#fsc-origin-search');
  await page.waitFor(1000);

  console.log('Compiling form data..');
  await page.type('#fsc-origin-search', args['origin'], {delay: 120});
  console.log(`Compiled origin airport: ${args['origin']}`);
  await page.waitFor(600);

  if(args['destination'] != 'Everywhere') {
  	await page.click('#fsc-destination-search');
	  await page.waitFor(600);

	  await page.type('#fsc-destination-search', args['destination'], {delay: 120});
	  console.log(`Compiled destination airport: ${args['destination']}`);
  }

  console.log('Opening departure datepicker');
  await page.click('#depart-fsc-datepicker-button');
  await page.waitFor(600);

  await page.waitForSelector('select[name="months"]');
  console.log('Departure datepicker opened');

  await setDatepicker(page, args['wholeMonthStart'], args['dayStart'], args['monthStart'], args['yearStart']);
  console.log('Departure datepicker updated');
  await page.waitFor(1000);


  // se è a/r
  if(args['oneWay'] !== true) {
  	console.log('Opening return datepicker');
  	await page.click('#return-fsc-datepicker-button');

		await page.waitForSelector('select[name="months"]');
		console.log('Return datepicker opened');
  	
  	await setDatepicker(page, args['wholeMonthEnd'], args['dayEnd'], args['monthEnd'], args['yearEnd']);
  	console.log('Return datepicker updated');
  }

  if(args['adults'] !== undefined && args['children'] !== undefined) {
  	args['adults'] = parseInt(args['adults']);
  	args['children'] = parseInt(args['children']);

  	console.log('Opening passenger popover');
		await page.click('[class*="CabinClassTravellersSelector_fsc-class-"]'); // Apro popover num passeggeri
		await page.waitForSelector('[class*="BpkPopover"]');
		console.log('Passenger popover opened');

		if(args['adults'] > 0){
			console.log(`Adding ${args['adults']} adults`);
			for (var i = 0; i < args['adults']-1; i++) {
				await page.click('[class*="BpkPopover"] div [class*="CabinClassTravellersSelector_CabinClassTravellersSelector__nudger-wrapper"]:nth-of-type(1) button:nth-of-type(2)'); // Aggiunta adulti, default 1
			};
		}

		if(args['children'] > 0) {
			console.log(`Adding ${args['children']} children`);
			for (var i = 0; i < args['children']-1; i++) {
				await page.click('[class*="BpkPopover"] div [class*="CabinClassTravellersSelector_CabinClassTravellersSelector__nudger-wrapper"]:nth-of-type(2) button:nth-of-type(2)'); // aggiunta bambini, default 0
			}
		}
  }

  await page.screenshot({path: 'screen/before-submit.png'});
  console.log('Submit login form..');
  await page.click('button[type="submit"]');
  
  var errorOnSearch = false;

  await page.waitForNavigation().then(() => console.log('Searched succesfully'), (err) => { errorOnSearch = true; console.log('Error on submit');});

  console.log('Wait for the results..');

  var detailPage = false;
  await page.waitForSelector('.browse-list-category:nth-of-type(1)', {timeout: 10000}).then(() => (detailPage = false), (err) => console.log('No search results, looking for details'));
	await page.waitForSelector('.day-list-item', {timeout: 5000}).then(() => (detailPage = true), (err) => console.log('No detail results'));

  console.log('Results are loaded');

  /*
	// in case of G recaptcha
  await page.screenshot({path: 'screen/before-submitted.png'});
  var frame = await page.frames()[2];

	await frame.evaluate(() => {
		document.querySelectorAll('.recaptcha-checkbox')[0].click();
	}).catch((err) => console.log('captcha not found'));

	await page.waitFor(800);
  await page.screenshot({path: 'screen/after-submitted.png'});
	*/
	console.log(await page.url());
  await page.screenshot({path: 'screen/submitted.png'});

  if(errorOnSearch === false) {

  	if(detailPage == true) {
			var detailList = await getRoutesData(page);
			console.log(detailList);
  	}else{
			var countries = await page.$$('.browse-data-route h3');
			var prices = await page.$$('.browse-data-route p');

			var countriesObj = {};

			for(let i in countries) {
				let textContentH3 = await countries[i].getProperty('textContent');
				let textContentP = await prices[i].getProperty('textContent');

				textContentH3 = await textContentH3.jsonValue();
				textContentP = await textContentP.jsonValue();
				countriesObj[textContentH3] = textContentP;
			}
			console.log(JSON.stringify(countriesObj));
			// cliccare su tutti i box, con delay, e recuperare la città e il prezzo a partire da
			// eventualmente cliccare su una città e recuperare i dati del dettaglio

			var dataElements = await page.$$('.browse-list-category');
			console.log('Getting details from list...');
			var detailResults = [];
			for(let e in dataElements) {
				await dataElements[e].click();
				await page.waitForSelector('.browse-list-result');
				var elementResult = await page.evaluate(() => {
					var results = [];
					var resultList = document.querySelectorAll('.browse-list-result');

					for(let i = 0; i < resultList.length; i++) {
						results.push({
							destination: resultList[i].querySelector('h3').innerText,
							direct: resultList[i].querySelector('.browse-data-directness').innerText,
							price: resultList[i].querySelector('.flightLink').innerText,
							url: resultList[i].querySelector('.flightLink').getAttribute('href')
						});
					}

					document.querySelector('.result-list ul').removeChild(document.querySelector('.browse-list-category.open'));
					return JSON.stringify(results);
				});
				detailResults.push(elementResult);

				await page.waitFor(800);
				/*if(e == 3) break;
				await dataElements[e].click();
				console.log("aspetto l'apertura");
				await page.waitForSelector('.browse-list-category.open a.flightLink');

				var linkElements = await page.$$('.browse-list-category.open a.flightLink');
				for (let j in linkElements) {
					if(j == 8) break;
					console.log('clicco sul link');
					await linkElements[j].click();
					await page.waitForNavigation();

					await page.screenshot({path: 'screen/submitted.png'});

					var detailList = await getRoutesData(page);
					console.log(detailList);
					detailResults.push(detailList);

					await page.waitFor(1000);
					await page.goBack();
				}*/
				
			}

			console.log(detailResults);

  	}
  }

  console.log('Window close');
  await browser.close();
})();