const elements = require('../../elements')['flightList'];

module.exports = class FlightList {
    constructor() {
        this.config = {};
    }

    async getData(scraperInstance) {
        await scraperInstance.page.waitForSelector(elements.results);
		return await scraperInstance.page.evaluate((selectors) => {
			var results = [];

			var tickets = document.querySelectorAll(selectors.results);
			for (let i = 0; i < tickets.length; i++) {
				var departureNodes = tickets[i].querySelectorAll(selectors.depart);
				var durationNodes = tickets[i].querySelectorAll(selectors.duration);
				var arrivalNodes = tickets[i].querySelectorAll(selectors.destination);
				var price = tickets[i].querySelector(selectors.price).innerText;

				var tempObj = {
					routes: [],
					price: price
				};

				for (let j = 0; j < departureNodes.length; j++) {
					tempObj['routes'].push({
						departure: departureNodes[j].innerText.replace(/\n/, ' '),
						duration: durationNodes[j].innerText.replace(/\n/, ' '),
						destination: arrivalNodes[j].innerText.replace(/\n/, ' ')
					});
				}
				results.push(tempObj);
			}

			return JSON.stringify(results);
		}, elements);
    }

}