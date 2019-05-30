const selectors = require('./elements');

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

    async signIn(username, password){
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
}