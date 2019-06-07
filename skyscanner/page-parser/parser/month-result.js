module.exports = class MonthResult {
    constructor() {
        this.config = {};
    }

    async getData(scraperInstance) {
        const calendarResult = await scraperInstance.page.evaluate(() => {
            var results = {
                outbound: [],
                inbound: []
            };

            for(let key in results) {
                document.querySelectorAll('button[direction="' + key + '"]').forEach(function(item){
                    if(item.className.search(/(blocked)/) === -1){
                        let objToPush = {};
                        objToPush[item.innerText.split(/\n/)[0]] = item.innerText.split(/\n/)[1];
                        results[key].push(objToPush);
                    }
                });
            }

            return results;
        });

        return calendarResult;
    }

}