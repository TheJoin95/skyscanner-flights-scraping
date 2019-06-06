const chalk = require('chalk');
const utils = require('./utils/utils');
const Browser = require('./browser/browser');
const SkyscannerScraper = require('./skyscanner/skyscanner');
const inquirer = require('inquirer');

/*language
currency*/

var questions = [
	{
	  type: 'confirm',
	  name: 'directOnly',
	  message: 'Direct flights only?',
	  default: false
	},
	{
	  type: 'confirm',
	  name: 'oneWay',
	  message: "Is a one way trip?",
	  default: false
	},
	{
	  type: 'input',
	  name: 'origin',
	  message: 'Type a city/airport/IATA code of depart',
	  validate: function(value) {
		  let valid = (value !== '' && value !== undefined);
		  return valid || 'Please type a city/airport/IATA Code';
	  }
	},
	{
		type: 'input',
		name: 'destination',
		message: 'Type a city/airport/IATA code of destination',
		default: 'Everywhere',
		validate: function(value) {
			let valid = (value !== '' && value !== undefined);
			return valid || 'Please type a city/airport/IATA Code';
		}
	},

	{
		type: 'input',
		name: 'yearStart',
		message: 'If different, type the depart year',
		default: 2019
	  },
	  {
		  type: 'list',
		  name: 'monthStart',
		  message: 'Select a month of depart',
		  choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		},
	{
		type: 'confirm',
		name: 'wholeMonthStart',
		message: 'Would you like to list the prices for the whole month?',
		default: false
	  },
	{
		type: 'input',
		name: 'dayStart',
		message: 'Type a day of depart',
		validate: function(value) {
		  var valid = !isNaN(parseInt(value));
		  return valid || 'Please enter a number';
		},
		when: function(answers) {
			return answers.wholeMonthStart === false;
		},
		filter: Number
	  },
	  {
		  type: 'input',
		  name: 'yearEnd',
		  message: 'If different, type the return year',
		  default: 2019,
		  when: function(answers) {
			  return answers.oneWay === false;
		  }
		},
		{
			type: 'list',
			name: 'monthEnd',
			message: 'Select a month of return',
			choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
			when: function(answers) {
				return answers.oneWay === false;
			}
		  },
	  {
		  type: 'confirm',
		  name: 'wholeMonthEnd',
		  message: 'Would you like to list the prices for the whole month?',
		  default: false,
		  when: function(answers) {
			  return answers.wholeMonthStart === true && answers.oneWay === false;
		  }
		},
	  {
		  type: 'input',
		  name: 'dayEnd',
		  message: 'Type a day of return',
		  validate: function(value) {
			var valid = !isNaN(parseInt(value));
			return valid || 'Please enter a number';
		  },
		  when: function(answers) {
			  return answers.oneWay === false && answers.wholeMonthStart === false;
		  },
		  filter: Number
		}
  ];
  
var args = null;
inquirer.prompt(questions).then(answers => {
	const defaultArgs = utils.getInputParameters();
	args = answers;
	args['ua'] = defaultArgs['ua'];
	args['wholeMonthEnd'] = args['wholeMonthEnd'] || false;

	console.log(args);

	// const args = utils.getInputParameters();

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
			ua: args['ua'], 
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
});