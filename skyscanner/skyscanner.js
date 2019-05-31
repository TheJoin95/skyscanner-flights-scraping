const selectors = require('./elements');
const utils = require('../utils/utils');

module.exports = class SkyscannerScraper {
    constructor() {
        this.config = {
            rootPage: 'https://www.skyscanner.com'
        };
        this.config.selectors = selectors;
    }

    attachBrowser(browser) {
        this.browserInstance = browser;
    }

    async init(options) {
        // instanziare pagine personalizzate, es. Homepage extends Page, DetailPage extends Page etc..
        this.page = await this.browserInstance.initPage(this.config.rootPage, options);
    }

    async signIn(username, password) {
        console.log('Initating Log in');
        try {
            await this.page.click('#login-button-nav-item button');
            await this.page.waitFor(400);
            await this.page.click('[data-testid="login-email-button"]');

            await this.page.type('.js-loginEmailInput', username);
            await this.page.type('#password', password);

            await this.page.click('[data-testid="login-button"]');
            console.log('Login succesfully');
        }catch(e) {
            throw Error('Login failed');
        }
    }

    /**
     * da mettere in classe searchPage che estende questa, forse?
     */
    async setOneWay() {
        await this.page.click('#fsc-trip-type-selector-one-way');
    }

    async setDirectOnly() {
        await this.page.click('input[name="directOnly"]');
    }

    async setOriginAirport(airport) {
        await this.page.click('#fsc-origin-search');
        await this.page.waitFor(1000);

        console.log('Compiling form data..');
        await this.page.type('#fsc-origin-search', airport, { delay: 120 });
        console.log(`Compiled origin airport: ${airport}`);
        await this.page.waitFor(600);
    }

    async setDestinationAirport(airport) {
        await this.page.click('#fsc-destination-search');
		await this.page.waitFor(600);

		await this.page.type('#fsc-destination-search', airport, { delay: 120 });
		console.log(`Compiled destination airport: ${airport}`);
    }

    async setSearchDate(type, wholeMonth, day, month, year) {
        var type = type || 'depart';

        console.log('Opening departure datepicker');
        await this.page.click('#' + type + '-fsc-datepicker-button');
        await this.page.waitForSelector('[class*="FlightDatepicker"]');
        console.log('Departure datepicker opened');
    
        await this.page.waitFor(600);
        await utils.setDatepicker(this.page, wholeMonth, day, month, year);
        console.log(type + ' datepicker updated');
    }

    async setDepartureDate(wholeMonthStart, dayStart, monthStart, yearStart) {
        await this.setSearchDate('depart', wholeMonthStart, dayStart, monthStart, yearStart);
    }

    async setReturnDate(wholeMonthEnd, dayEnd, monthEnd, yearEnd) {
        await this.setSearchDate('return', wholeMonthEnd, dayEnd, monthEnd, yearEnd);
    }

    async submitSearch() {        
        await this.page.screenshot({ path: 'screen/before-submit.png' });
        await this.page.waitFor(1000);
        console.log('Submit login form..');
        await this.page.click('button[type="submit"]');

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
}
