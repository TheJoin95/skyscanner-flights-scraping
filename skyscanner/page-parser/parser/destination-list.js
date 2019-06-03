const elements = require('../../elements');

module.exports = class DestinationList {
    constructor() {
        this.config = {
            maxDestination: 20,
            maxDestinationLevel: 15
        };
    }

    async getData(scraperInstance) {
        /*var countries = await scraperInstance.page.$$('.browse-data-route h3');
        var prices = await scraperInstance.page.$$('.browse-data-route p');

        var countriesObj = {};

        for (let i in countries) {
            let textContentH3 = await countries[i].getProperty('textContent');
            let textContentP = await prices[i].getProperty('textContent');

            textContentH3 = await textContentH3.jsonValue();
            textContentP = await textContentP.jsonValue();
            countriesObj[textContentH3] = textContentP;
        }*/

        var dataElements = await scraperInstance.page.$$('.browse-list-category');
        console.log('Getting details from list...');

        var results = [];
        for (let e in dataElements) {
            if (e >= this.config.maxDestination) break;
            await dataElements[e].click();
            await scraperInstance.page.waitForSelector('.browse-list-result');
            var elementResult = await scraperInstance.page.evaluate(() => {
                var results = [];
                var resultList = document.querySelectorAll('.browse-list-result');

                for (let i = 0; i < resultList.length; i++) {
                    if (i >= this.config.maxDestinationLevel) break;
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

            results.push(elementResult);
            await scraperInstance.page.waitFor(200);
        }

        console.log(results);
        return results;
    }

}