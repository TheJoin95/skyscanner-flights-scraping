const chalk = require('chalk');

const utils = require('./utils/utils');
const Browser = require('./browser/browser');
const SkyscannerScraper = require('./skyscanner/skyscanner');
const express = require('express');
const app = express();

var browser, skyscannerWorkers = null;
const args = utils.getInputParameters();
const WORKERS = 5;

async function initBrowser () {
	browser = new Browser(args);
	await browser.init();

	skyscannerWorkers = [];
	for(let i = 0; i < WORKERS; i++) {
		let instance = new SkyscannerScraper();
		instance.attachBrowser(browser);
		await instance.init({
			fakingUserInteraction: true,
			ua: args['ua'], 
			'intercept-request': true
		});

		console.log(chalk.bgCyan('Faking user interaction..'));
		await utils.fakingUserInteraction(instance.page);

		skyscannerWorkers.push(instance);
	}
};

app.get('/', async function (req, res) {

	var args = {
		oneWay: false,
		wholeMonthStart: false,
		dayStart: (new Date().getDay()+1),
		monthStart: (new Date().getMonth()+1),
		yearStart: (new Date().getFullYear()),
		wholeMonthEnd: false,
		dayEnd: (new Date().getDay()+1),
		monthEnd: (new Date().getMonth()+1),
		yearEnd: (new Date().getFullYear())
	};

	args.oneWay = req.query.oneWay || args.oneWay;
	args.directOnly = req.query.directOnly || args.directOnly;
	args.origin = req.query.origin || args.origin;
	args.destination = req.query.destination || args.destination;
	args.wholeMonthStart = req.query.wholeMonthStart || args.wholeMonthStart;
	args.dayStart = req.query.dayStart || args.dayStart;
	args.monthStart = req.query.monthStart || args.monthStart;
	args.yearStart = req.query.yearStart || args.yearStart;
	args.wholeMonthEnd = req.query.wholeMonthEnd || args.wholeMonthEnd;
	args.dayEnd = req.query.dayEnd || args.dayEnd;
	args.monthEnd = req.query.monthEnd || args.monthEnd;
	args.yearEnd = req.query.yearEnd || args.yearEnd;

	if(args.origin === undefined || args.origin.trim() == '' || args.destination === undefined || args.destination.trim() === '') {
		res.status(400);
		res.send('You need to specify the origin airport and the destination airport');
		return false;
	}

	var scraperInstance = null;
	var workerIndex = 0;
	try {
		for(let i = 0; i < WORKERS; i++) {
			if(skyscannerWorkers[i].isWorking() === false){
				workerIndex = i;
				scraperInstance = skyscannerWorkers[i];
				scraperInstance.toggleWorking();
				break;
			}
		}

		if(scraperInstance == null) {
			res.status(401);
			res.send('No more worker. Wait 30s and retry');
			return false;
		}

		await scraperInstance.checkAndOpenSearchbar();
		// await scraperInstance.page.screenshot({ path: 'screen/test.png' });

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

		// await scraperInstance.page.screenshot({ path: 'screen/test-1.png' });

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
			console.log('Wait for the results..');

			var pageParser = await scraperInstance.createPageParser();
			var results = await pageParser.getData(scraperInstance);
			console.log(results);
		}

		scraperInstance.toggleWorking();
		res.send(results);
	} catch (error) {
		skyscannerWorkers[workerIndex].init({
			ua: args['ua'], 
			'intercept-request': true
		});
		res.status(500).send('Error: ' + error);
	}
});

app.listen(3000, async function () {
	console.log('listening on port 3000!');
	await initBrowser();
	console.log('browser ready');
});
