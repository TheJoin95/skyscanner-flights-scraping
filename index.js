const chalk = require('chalk');

const utils = require('./utils/utils');
const browserLauncher = require('./skyscanner/browser');

const defaultUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36';
const rootPage = 'https://www.skyscanner.com';
const defaultConfiguration = {
	directOnly: true,
	destination: 'Everywhere',
	wholeMonthStart: false,
	wholeMonthEnd: false,
	oneWay: true
};

const args = utils.getParameters(defaultConfiguration);

if (Object.keys(args).indexOf('h') !== -1) {
	utils.showHelp();
	return false;
}

utils.validateInputArguments(args);

(async () => {
	const browser = await browserLauncher.init(args);

	const page = await browser.newPage();
	await page.setUserAgent(defaultUA);
	
	await page.setRequestInterception(true);
	page.on('request', (req) => {
		if (req.resourceType() == 'font' || req.resourceType() == 'image') {
			req.abort();
		} else {
			req.continue();
		}
	});
	// await page.setJavaScriptEnabled(false);

	console.log(chalk.yellow('Loading Skyscanner HP'));
	await page.goto(rootPage);
	
	console.log(chalk.bgCyan('Faking user interaction..'));
	await utils.fakingUserInteraction(page);

	if (args['username'] !== undefined && args['password'] !== undefined) {
		console.log(chalk.yellow('Initating Log in'));
		await page.click('#login-button-nav-item button');
		await page.waitFor(400);
		await page.click('[data-testid="login-email-button"]');

		await page.type('.js-loginEmailInput', args['username']);
		await page.type('#password', args['password']);

		await page.click('[data-testid="login-button"]');
		console.log(chalk.green('Login succesfully'));
	}

	// await page.click('#fsc-trip-type-selector-return'); // enabled by default

	console.log(chalk.yellow("Is oneWay: " + chalk.underline.bold(args['oneWay'])));
	if (args['oneWay'] === true)
		await page.click('#fsc-trip-type-selector-one-way');

	console.log(chalk.yellow("Is directOnly: " + chalk.underline.bold(args['directOnly'])));
	if (args['directOnly'] === true)
		await page.click('input[name="directOnly"]');

	await page.click('#fsc-origin-search');
	await page.waitFor(1000);

	console.log(chalk.bgCyan('Compiling form data..'));
	await page.type('#fsc-origin-search', args['origin'], { delay: 120 });
	console.log(chalk.green(`Compiled origin airport: ${args['origin']}`));
	await page.waitFor(600);

	if (args['destination'] != 'Everywhere') {
		await page.click('#fsc-destination-search');
		await page.waitFor(600);

		await page.type('#fsc-destination-search', args['destination'], { delay: 120 });
		console.log(chalk.green(`Compiled destination airport: ${args['destination']}`));
	}

	console.log(chalk.bgCyan('Opening departure datepicker'));
	await page.click('#depart-fsc-datepicker-button');
	await page.waitForSelector('[class*="FlightDatepicker"]');
	console.log(chalk.bgCyan('Departure datepicker opened'));

	await page.waitFor(600);
	await utils.setDatepicker(page, args['wholeMonthStart'], args['dayStart'], args['monthStart'], args['yearStart']);
	console.log(chalk.green('Departure datepicker updated'));

	if (args['oneWay'] !== true) {
		await page.waitFor(600);
		console.log('Opening return datepicker');
		await page.click('#return-fsc-datepicker-button');

		await page.waitForSelector('[class*="FlightDatepicker"]');
		console.log('Return datepicker opened');
		
		await page.waitFor(600);
		await utils.setDatepicker(page, args['wholeMonthEnd'], args['dayEnd'], args['monthEnd'], args['yearEnd']);
		console.log(chalk.green('Return datepicker updated'));
	}

	if (args['adults'] !== undefined || args['children'] !== undefined) {
		args['adults'] = parseInt(args['adults']);
		args['children'] = parseInt(args['children']);

		console.log('Opening passenger popover');
		await page.click('[name="class-travellers-trigger"]'); // Apro popover num passeggeri
		await page.waitForSelector('[class*="BpkPopover"]');
		console.log('Passenger popover opened');

		if (args['adults'] > 0) {
			console.log(`Adding ${args['adults']} adults`);
			for (var i = 0; i < args['adults'] - 1; i++) {
				await page.click('[class*="BpkPopover"] div [class*="CabinClassTravellersSelector_CabinClassTravellersSelector__nudger-wrapper"]:nth-of-type(1) button:nth-of-type(2)'); // default 1
			};
		}

		if (args['children'] > 0) {
			console.log(`Adding ${args['children']} children`);
			for (var i = 0; i < args['children'] - 1; i++) {
				await page.click('[class*="BpkPopover"] div [class*="CabinClassTravellersSelector_CabinClassTravellersSelector__nudger-wrapper"]:nth-of-type(2) button:nth-of-type(2)'); // default 0
			}
		}

		await page.click('[class*="BpkPopover_bpk-popover__footer"] button');
	}

	await page.screenshot({ path: 'screen/before-submit.png' });
	await page.waitFor(1000);
	console.log('Submit login form..');
	await page.click('button[type="submit"]');


	var errorOnSearch = false;
	await page.waitForNavigation({waitUntil: 'networkidle2'}).then(
		() => console.log(chalk.green('Searched succesfully')),
		(err) => { errorOnSearch = true; console.log(chalk.bgRed('Error on submit')); }
	);

  /*
	// in case of G recaptcha
	await utils.clickOnRecaptcha(page);
	*/

	console.log(await page.url());
	await page.screenshot({ path: 'screen/submitted.png' });

	if (errorOnSearch === false) {
		console.log('Wait for the results..');
		var detailPage = false;

		// Destination list
		await page.waitForSelector('.browse-list-category:nth-of-type(1)', {
			timeout: 200
		}).then(
			() => (detailPage = false),
			(err) => console.log('No search results, looking for details')
		);
		
		var intermediatePage = false;
		await page.waitForSelector('#day-flexible-days-section .fss-fxo-select button:last-child', {timeout: 200}).then(
			() => (intermediatePage = true),
			(err) => (console.log('...'))
		);

		if(intermediatePage == true) {
			console.log('Is an intermediate page.. going in details');
			await page.click('#day-flexible-days-section .fss-fxo-select button:last-child');
			await page.waitForNavigation().catch((err) => console.log('Something wrong'));
		}

		await page.waitForSelector('.day-no-results-cushion', {timeout: 200}).then(
			() => (console.log('No flight for these dates.')),
			(err) => console.log('...')
		);

		var monthView = false; 
		// nella monthView in realtà io dovrei dare la possibilità di selezionare le date e trovare i prezzi..
		// Possibilità di usare Inquier.js ?
		await page.waitForSelector('.month-view', {timeout: 200}).then(
			() => (monthView = true),
			(err) => console.log('No month view')
		);

		// Flight list
		// more results => .day-list-container .bpk-button--secondary
		await page.waitForSelector('.day-list-item', { timeout: 200 }).then(
			() => (detailPage = true),
			(err) => console.log('No detail results')
		);

		if (detailPage == true) {
			var detailList = await utils.getRoutesData(page);
			console.log(detailList);
		}else if(monthView == true){
			const calendarResult = await page.evaluate(() => {
				var results = {
					outbound: [],
					inbound: []
				};

				for(let key in results) {
					document.querySelectorAll('button[direction="' + key + '"]').forEach(function(item){
						if(item.className.search(/(blocked)/) === -1){
							let objToPush = {};
							objToPush[item.innerText.split(/\n/)[0]] = item.innerText.split(/\n/)[1];
							results[key].push(objToPush);
						}
					});
				}

				return results;
			});

			console.log(calendarResult);

		} else {
			var countries = await page.$$('.browse-data-route h3');
			var prices = await page.$$('.browse-data-route p');

			var countriesObj = {};

			for (let i in countries) {
				let textContentH3 = await countries[i].getProperty('textContent');
				let textContentP = await prices[i].getProperty('textContent');

				textContentH3 = await textContentH3.jsonValue();
				textContentP = await textContentP.jsonValue();
				countriesObj[textContentH3] = textContentP;
			}
			console.log(JSON.stringify(countriesObj));

			var dataElements = await page.$$('.browse-list-category');
			console.log('Getting details from list...');

			var detailResults = [];
			for (let e in dataElements) {
				if (e == 20) break;
				await dataElements[e].click();
				await page.waitForSelector('.browse-list-result');
				var elementResult = await page.evaluate(() => {
					var results = [];
					var resultList = document.querySelectorAll('.browse-list-result');

					for (let i = 0; i < resultList.length; i++) {
						if (i == 15) break;
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

				await page.waitFor(400);

			}
			console.log(detailResults);
		}
	}

	console.log('Window close');
	await browser.close();
})();