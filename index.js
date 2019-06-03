const chalk = require('chalk');

const utils = require('./utils/utils');
const Browser = require('./browser/browser');
const SkyscannerScraper = require('./skyscanner/skyscanner');

const defaultUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36';
const defaultParametersConfiguration = {
	directOnly: true,
	destination: 'Everywhere',
	wholeMonthStart: false,
	wholeMonthEnd: false,
	oneWay: true
};

const args = utils.getParameters(defaultParametersConfiguration);

if (Object.keys(args).indexOf('h') !== -1) {
	utils.showHelp();
	return false;
}

utils.validateInputArguments(args);

(async () => {
	const browser = new Browser(args);
	await browser.init();

	const skyscannerScraperInstance = new SkyscannerScraper();
	skyscannerScraperInstance.attachBrowser(browser);
	await skyscannerScraperInstance.init({
		fakingUserInteraction: true,
		ua: defaultUA, 
		'intercept-request': true
	});
	
	console.log(chalk.bgCyan('Faking user interaction..'));
	await utils.fakingUserInteraction(skyscannerScraperInstance.page);

	if (args['username'] !== undefined && args['password'] !== undefined) {
		await skyscannerScraperInstance.signIn(args['username'], args['password']);
	}

	// await skyscannerScraperInstance.page.click('#fsc-trip-type-selector-return'); // enabled by default

	console.log(chalk.yellow("Is oneWay: " + chalk.underline.bold(args['oneWay'])));
	if (args['oneWay'] === true)
		await skyscannerScraperInstance.setOneWay();

	console.log(chalk.yellow("Is directOnly: " + chalk.underline.bold(args['directOnly'])));
	if (args['directOnly'] === true)
		await skyscannerScraperInstance.setDirectOnly();

	await skyscannerScraperInstance.setOriginAirport(args['origin']);

	if (args['destination'] != 'Everywhere') {
		await skyscannerScraperInstance.setDestinationAirport(args['destination']);
	}

	await skyscannerScraperInstance.setDepartureDate(
		args['wholeMonthStart'],
		args['dayStart'],
		args['monthStart'],
		args['yearStart']
	);

	if (args['oneWay'] !== true) {
		await skyscannerScraperInstance.setReturnDate(
			args['wholeMonthEnd'],
			args['dayEnd'],
			args['monthEnd'],
			args['yearEnd']
		);
	}

	if(args['adults'] !== undefined || args['children'] !== undefined)
		await skyscannerScraperInstance.setPassengersData(args['adults'], args['children']);

	await skyscannerScraperInstance.submitSearch();	

  	/*
	// in case of G recaptcha
	await utils.clickOnRecaptcha(page);
	*/

	if(await skyscannerScraperInstance.loadResultPage()) {
		console.log(await skyscannerScraperInstance.page.url());
		// await skyscannerScraperInstance.page.screenshot({ path: 'screen/submitted.png' });

		console.log('Wait for the results..');

		var pageParser = await skyscannerScraperInstance.createPageParser();
		var results = await pageParser.getData(skyscannerScraperInstance);
		console.log(results);
	}

	console.log('Window close');
	await browser.close();
})();