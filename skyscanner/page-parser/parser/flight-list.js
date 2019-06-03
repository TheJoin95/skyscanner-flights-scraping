const elements = require('../../elements');

module.exports = class FlightList {
    constructor() {
        this.config = {};
    }

    async getData(scraperInstance) {
        await scraperInstance.page.waitForSelector('.day-list-item div article.result');
		return await scraperInstance.page.evaluate(() => {
			var results = [];

			var tickets = document.querySelectorAll('.day-list-item div article.result');
			for (let i = 0; i < tickets.length; i++) {
				var departureNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-depart"]');
				var durationNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-stops-3lHev"]');
				var arrivalNodes = tickets[i].querySelectorAll('[class*="LegInfo__leg-arrive"]');
				var price = tickets[i].querySelector('.price').innerText;

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
		});
    }

}