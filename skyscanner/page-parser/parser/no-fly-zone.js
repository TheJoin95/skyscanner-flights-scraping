const elements = require('../../elements');

module.exports = class NoFlyZone {
    constructor() {
        this.config = {};
    }

    async getData(scraperInstance) {
        console.log("No results available");
        return {};
    }

}