const MonthResult = require('./parser/month-result');
const NoFlyZone = require('./parser/no-fly-zone');
const DestinationList = require('./parser/destination-list');
const FlightList = require('./parser/flight-list');

module.exports = class PageFactory {
    static createPageParser(parserName) {
        var parserInstance = null;
        switch (parserName) {
            case 'destinationList':
                parserInstance = new DestinationList();
                break;

            case 'noFlightResult':
                parserInstance = new NoFlyZone();
                break;
                
            case 'monthResult':
                parserInstance = new MonthResult();
                break;

            case 'flightList':
                parserInstance = new FlightList();
                break;

            default:
                throw Error('Invalid parser');
        }

        return parserInstance;
    }
}