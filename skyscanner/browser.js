const puppeteer = require('puppeteer-extra');
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

module.exports = {
    init: async function(args) {
        return await puppeteer.launch({
            headless: (Object.keys(args).indexOf('debug') === -1),
            // args: ['--deterministic-fetch'],
            defaultViewport: {
                width: 1600,
                height: 900
            }
        }).catch((err) => {throw Error(err)});
    }
};