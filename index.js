const chalk = require('chalk');

const utils = require('./utils/utils');
const Browser = require('./browser/browser');
const SkyscannerScraper = require('./skyscanner/skyscanner');
const express = require('express');
const app = express();

var browser, skyscannerScraperInstance = null;
const args = utils.getInputParameters();

(async () => {
	browser = new Browser(args);
	await browser.init();

	skyscannerScraperInstance = [];
	for(let i = 0; i < 3; i++) {
		let instance = new SkyscannerScraper();
		instance.attachBrowser(browser);
		await instance.init({
			fakingUserInteraction: true,
			ua: args['ua'], 
			'intercept-request': true
		});

		console.log(chalk.bgCyan('Faking user interaction..'));
		await utils.fakingUserInteraction(instance.page);

		skyscannerScraperInstance.push(instance);
	}
})();

app.get('/', async function (req, res) {

	try {
		var scraperInstance = null;

		for(let i = 0; i < 3; i++) {
			if(skyscannerScraperInstance[i].isWorking() === false){
				scraperInstance = skyscannerScraperInstance[i];
				scraperInstance.toggleWorking();
				break;
			}
		}

		if(scraperInstance == null) {
			res.status(401);
			res.send('No more worker. Wait 30s and retry');
		}
		
		// questi sono parametri POST|GET
		var args = {
			oneWay: false,
			directOnly: false,
			origin: 'PSA',
			destination: 'Amsterdam',
			wholeMonthStart: false,
			dayStart: 19,
			monthStart: 8,
			yearStart: 2019,
			wholeMonthEnd: false,
			dayEnd: 29,
			monthEnd: 8,
			yearEnd: 2019
		};

		var optimizedSearch = false;
		await scraperInstance.page.click('#flights-search-summary-toggle-search-button').then(() => optimizedSearch = true, (err) => console.log("nope"));

		if(optimizedSearch == true)
			await scraperInstance.page.waitForSelector('#fsc-origin-search');


		await scraperInstance.page.screenshot({ path: 'screen/test.png' });

		console.log(chalk.yellow("Is oneWay: " + chalk.underline.bold(args['oneWay'])));
		if (args['oneWay'] === true)
			await scraperInstance.setOneWay();

		console.log(chalk.yellow("Is directOnly: " + chalk.underline.bold(args['directOnly'])));
		if (args['directOnly'] === true)
			await scraperInstance.setDirectOnly();

		await scraperInstance.setOriginAirport(args['origin']);

		if (args['destination'] != 'Everywhere') {
			await scraperInstance.setDestinationAirport(args['destination']);
		}

		await scraperInstance.setDepartureDate(
			args['wholeMonthStart'],
			args['dayStart'].toString(),
			args['monthStart'].toString(),
			args['yearStart']
		);

		await scraperInstance.page.screenshot({ path: 'screen/test-1.png' });

		if (args['oneWay'] !== true) {
			await scraperInstance.setReturnDate(
				args['wholeMonthEnd'],
				args['dayEnd'].toString(),
				args['monthEnd'].toString(),
				args['yearEnd']
			);
		}

		if(args['adults'] !== undefined || args['children'] !== undefined)
			await scraperInstance.setPassengersData(args['adults'], args['children']);

		await scraperInstance.submitSearch();	

		// in case of G recaptcha
		// await utils.clickOnRecaptcha(page);

		if(await scraperInstance.loadResultPage()) {
			console.log(await scraperInstance.page.url());
			// await scraperInstance.page.screenshot({ path: 'screen/submitted.png' });

			console.log('Wait for the results..');

			var pageParser = await scraperInstance.createPageParser();
			var results = await pageParser.getData(scraperInstance);
			console.log(results);
		}
		scraperInstance.toggleWorking();
		res.send(results);
	} catch (error) {
		scraperInstance.init({
			ua: args['ua'], 
			'intercept-request': true
		});
		res.status(500).send('Error: ' + error);
	}
});

app.listen(3000, function () {
  console.log('listening on port 3000!');
});
