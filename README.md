# scraper

scrapes provided links and markup and notifies user when there is a hit. uses puppeteer to mock a browser session via headless chromium, then cycles through a list of self defined proxy IPs (i.e. using Tor which is free) with a random timeout to bypass bot detection

currently there is a memory leak (in macOS at least) that needs to be addressed
