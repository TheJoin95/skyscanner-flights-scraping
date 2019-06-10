const elements = require('../../elements')['destinationList'];

module.exports = class DestinationList {
    constructor() {
        this.config = {
            maxDestination: 20,
            maxDestinationLevel: 15
        };
    }

    async getData(scraperInstance) {
        const config = {
            maxDestination: 20,
            maxDestinationLevel: 15
        };
        var dataElements = await scraperInstance.page.$$(elements.dataContainer);
        console.log('Getting details from list...');

        var results = [];
        for (let e in dataElements) {
            if (e >= config.maxDestination) break;
            await dataElements[e].click();
            await scraperInstance.page.waitForSelector(elements.record);
            var elementResult = await scraperInstance.page.evaluate((selectors, config) => {
                var results = [];
                var resultList = document.querySelectorAll(selectors.record);

                for (let i = 0; i < resultList.length; i++) {
                    if (i >= config.maxDestinationLevel) break;
                    results.push({
                        destination: resultList[i].querySelector(selectors.title).innerText,
                        direct: resultList[i].querySelector(selectors.direct).innerText,
                        price: resultList[i].querySelector(selectors.url).innerText,
                        url: resultList[i].querySelector(selectors.url).getAttribute('href')
                    });
                }

                document.querySelector(selectors.parentDataContainer).removeChild(document.querySelector(selectors.dataContainerOpened));
                return JSON.stringify(results);
            }, elements, config);

            results.push(elementResult);
            await scraperInstance.page.waitFor(200);
        }

        return results;
    }

}