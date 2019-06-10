const selectors = require('./elements');
const utils = require('../utils/utils');
const PageFactory = require('./page-parser/page-factory');

module.exports = class SkyscannerScraper {
    constructor() {
        this.config = {
            rootPage: 'https://www.skyscanner.com',
            availablePageParser: {
                destinationList: '.browse-list-category:nth-of-type(1)',
                noFlightResult: '.day-no-results-cushion',
                monthResult: '.month-view',
                flightList: '.day-list-item'
            },
            selectors: selectors,
            enableScreenshot: false
        };
    }

    attachBrowser(browser) {
        this.browserInstance = browser;
    }

    async takeScreenshot(options) {
        if(this.config.enableScreenshot === true)
            await this.page.screenshot(options);
    }

    isWorking() {
        return this.working;
    }

    toggleWorking() {
        this.working = !this.working;
    }

    async init(options) {
        // instanziare pagine personalizzate, es. Homepage extends Page, DetailPage extends Page etc..
        this.page = await this.browserInstance.initPage(this.config.rootPage, options);
        this.working = false;
        /*this.pages = [];
        for(let i = 0; i < options.pages; i++)
            this.pages.push(await this.browserInstance.initPage(this.config.rootPage, options));
        
        this.setPage(0);*/
    }

    async checkAndOpenSearchbar() {
		var optimizedSearch = false;
        await this.page.click('#flights-search-summary-toggle-search-button')
            .then(
                () => optimizedSearch = true,
                (err) => console.log("no searchar available")
            );

		if(optimizedSearch == true)
			await this.page.waitForSelector('#fsc-origin-search');
    }

    /*setPage(index) {
        var index = index || 0;
        this.page = this.pages[index];
    }

    getAvailablePage() {
        let page = null;

        this.workingPage = this.workingPage || [];
        // this.workingPage.sort((a, b) => a - b); // num, asc

        for(let i = 0; i < this.pages.length; i ++) {
            if(this.workingPage.indexOf(i) === -1) {
                page = i;
                break;
            }
        }

        return page;
    }

    toggleWorkingPage(index) {
        if(this.workingPage === undefined)
            this.workingPage = [];

        let toggleIndex = this.workingPage.indexOf(index);
        if(toggleIndex === -1)
            this.workingPage.push(index);
        else
            this.workingPage.splice(toggleIndex, 1);
        
    }*/

    async signIn(username, password) {
        console.log('Initating Log in');
        try {
            await this.page.click(this.config.selectors.login.signInButton);
            await this.page.click(this.config.selectors.login.focusableEmailElement);

            await this.page.type(this.config.selectors.login.emailElement, username);
            await this.page.type(this.config.selectors.login.passwordElement, password);

            await this.page.click(this.config.selectors.login.signinSubmitButton);
            console.log('Login succesfully');
        }catch(e) {
            throw Error('Login failed');
        }
    }

    /**
     * da mettere in classe searchPage che estende questa, forse?
     */
    async setOneWay() {
        await this.page.click(this.config.selectors.searchOptions.oneWayButton);
    }

    async setReturnFlag() {
        await this.page.click(this.config.selectors.searchOptions.returnButton);
    }

    async setDirectOnly() {
        await this.page.click(this.config.selectors.searchOptions.directOnlyButton);
    }

    async setOriginAirport(airport) {
        await this.page.click(this.config.selectors.searchOptions.originAirport);

        console.log('Compiling form data..');
        await this.page.type(this.config.selectors.searchOptions.originAirport, airport, { delay: 120 });
        console.log(`Compiled origin airport: ${airport}`);
    }

    async setDestinationAirport(airport) {
        await this.page.click(this.config.selectors.searchOptions.destinationAirport);
		// await this.page.waitFor(600);

		await this.page.type(this.config.selectors.searchOptions.destinationAirport, airport, { delay: 120 });
		console.log(`Compiled destination airport: ${airport}`);
    }

    async setSearchDate(type, wholeMonth, day, month, year) {
        var type = type || 'depart';

        console.log('Opening departure datepicker');
        await this.page.click('#' + type + '-fsc-datepicker-button');
        await this.page.waitForSelector(this.config.selectors.datePicker.flightPicker);
        console.log('Departure datepicker opened');
    
        // await this.page.waitFor(600);
        await utils.setDatepicker(this.page, wholeMonth, day, month, year);
        console.log(type + ' datepicker updated');
    }

    async setDepartureDate(wholeMonthStart, dayStart, monthStart, yearStart) {
        await this.setSearchDate('depart', wholeMonthStart, dayStart, monthStart, yearStart);
    }

    async setReturnDate(wholeMonthEnd, dayEnd, monthEnd, yearEnd) {
        await this.setSearchDate('return', wholeMonthEnd, dayEnd, monthEnd, yearEnd);
    }

    async setPassengersData(adults, children) {
        if (adults !== undefined || children !== undefined) {
            adults = parseInt(adults);
            children = parseInt(children);
    
            console.log('Opening passenger popover');
            await this.page.click(this.config.selectors.passengerOptions.popupButton);
            await this.page.waitForSelector(this.config.selectors.passengerOptions.popup);
            console.log('Passenger popover opened');
    
            if (adults > 0) {
                console.log(`Adding ${adults} adults`);
                for (var i = 0; i < adults - 1; i++) {
                    await this.page.click(this.config.selectors.passengerOptions.adultButton); // default 1
                };
            }
    
            if (children > 0) {
                console.log(`Adding ${children} children`);
                for (var i = 0; i < children - 1; i++) {
                    await this.page.click(this.config.selectors.passengerOptions.childrenButton); // default 0
                }
            }
    
            await this.page.click(this.config.selectors.passengerOptions.passengerSubmitButton);
        }
    }

    async submitSearch() {        
        await this.takeScreenshot({ path: 'screen/before-submit.png' });
        // await this.page.waitFor(1000);
        console.log('Submit login form..');
        await this.page.click(this.config.selectors.common.searchSubmit);

    }

    async loadResultPage() {
        var loaded = false;
        await this.page.waitForNavigation({waitUntil: 'networkidle2'})
            .then(
                () => { loaded = true; console.log('Searched succesfully') },
                (err) => { console.log('Error on submit'); }
        );

        return loaded;
    }

    async isIntermediatePage() {
        var intermediatePage = false;
		await this.page.waitForSelector(this.config.selectors.common.flexibleDate, {timeout: 200}).then(
			() => (intermediatePage = true),
			(err) => (console.log('...'))
		);

		if(intermediatePage == true) {
			console.log('Is an intermediate page.. going in details');
			await this.page.click(this.config.selectors.common.flexibleDate);
			await this.page.waitForNavigation().catch((err) => console.log('Something went wrong'));
		}
    }

    async createPageParser() {
        var isPageParsable = false;

        await this.isIntermediatePage(); // if true, waitForNavigation..

		// Flight list
		// more results => .day-list-container .bpk-button--secondary
        
        for (let pageParser in this.config.availablePageParser) {
            await this.page.waitForSelector(this.config.availablePageParser[pageParser], {
                timeout: 400
            }).then(
                () => (isPageParsable = true),
                (err) => console.log(`No ${pageParser} results`)
            );

            if(isPageParsable === true)
                return PageFactory.createPageParser(pageParser);
        }
    }
}
