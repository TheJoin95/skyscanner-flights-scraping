const puppeteer = require('puppeteer-extra');
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

module.exports = class Browser {
    constructor (args) {
        this.options = {};
        this.options.headless = (Object.keys(args).indexOf('debug') === -1);
    }

    async init() {
        this.browserInstance = await puppeteer.launch({
            headless: this.options.headless,
            // args: ['--deterministic-fetch'],
            defaultViewport: {
                width: 1600,
                height: 900
            }
        }).catch((err) => {throw Error(err)});
    }

    async initPage(url, options) {
        const page = await this.browserInstance.newPage();
        await page.setUserAgent(options['ua']);
        
        if(options['intercept-request'] !== undefined) {
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() == 'font' || req.resourceType() == 'image') {
                    req.abort();
                } else {
                    req.continue();
                }
            });
        }
        // await page.setJavaScriptEnabled(false);

        console.log('Loading ' + url);
        await page.goto(url);

        return page;
    }

    async getPages() {
        return await this.browserInstance.pages();
    }

    async close() {
        this.browserInstance.close();
    }
};