# Skyscanner Flights Scraping
Retrieve the flights data by an interactive CLI or using a custom API that is interfacing with the skyscanner scraper.

These script is just for personal use and for learning purpose, not for commercial use.

## Usage & Setup

Clone this repository and then run:

`npm install`

Then you can choose which script to execute:
- index.js
- index-concurrency.js
- index-inquirer.js

They do the same work but in some different way:
- the index.js script accept all the params by CLI. Type `node index.js -h` to get some help;
- the index-concurrency.js is a web server with a simple API endpoint to get the flights data. This script can manage concurrency of the skyscanner scraper
- the index-inquirer.js is an interactive CLI and it's using Inquirer.js

## Puppeter
Puppeter is a NodeJS library to interface with the Chromium API.

## ExpressJS
Express is a fast and fancy web server in NodeJS.

I've implemented a light web server in the index-concurrency.js script that provide a simple API to get the info about the flights.

## Docker
You can run these script using also Docker.

You can refer to the offical (Puppeteer repo)[https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker].

## Contribution
Feel free to contribute by open an issue or creating a pull request.