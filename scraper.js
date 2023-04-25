const notifier = require('node-notifier');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { enchantPuppeteer } = require('enchant-puppeteer');
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const sites = [
  {
    name: 'GME',
    url: 'https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5/11108140.html?condition=New',
    // https://www.gamestop.com/video-games/nintendo-switch/consoles/products/nintendo-switch-with-neon-blue-and-neon-red-joy-con/11095819.html?condition=New,  //works
    query: 'button.add-to-cart:not([disabled])',
  },
  {
    name: 'AMZ',
    url: 'https://www.amazon.com/dp/B08FC5L3RG/?coliid=IGXUWYIR9RKT3&colid=2ZY2K6T1FX4SB&psc=0&ref_=lv_ov_lig_dp_it',
    // url: 'https://www.amazon.com/dp/B08VJNMWR8/?coliid=I2ODKJ2J0CO80K&colid=2ZY2K6T1FX4SB&psc=1&ref_=lv_ov_lig_dp_it',   //works
    query: 'input[id="buy-now-button"]',
  },
  {
    name: 'TGT',
    url: 'https://www.target.com/p/playstation-5-console/-/A-81114595#lnk=sametab',
    // url: 'https://www.target.com/p/dualsense-wireless-controller-for-playstation-5-white-black/-/A-81114477',  //works
    query: 'div[data-test="shippingBlock"]',
  },
  // {
  //   name: 'Target',
  //   url: 'https://www.target.com/p/playstation-5-console/-/A-81114595#lnk=sametab',
  //   // url: 'https://www.target.com/p/dualsense-wireless-controller-for-playstation-5-white-black/-/A-81114477',  //works
  //   query: 'div[data-test="shippingBlock"]',
  // },
];

const initiateScraper = async () => {
  try {
    const { available, url } = await getPS5(sites);

    if (available) {
      notifier.notify(`PS5 is available!`);
      const browser = await puppeteer.launch({
        headless: false,
      });
      const page = (await browser.pages())[0];
      await page.goto(url);
      return;
    } else {
      const date = new Date();
      const options =  {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true,
        timeZone: 'America/New_York'
      };
      const randomTimeout = (Math.random() * 25) * 1000 + 10000;
      console.log(`${new Intl.DateTimeFormat('en-US', options).format(date)} - Setting timeout of: ${randomTimeout / 1000}s`);
      const timer = setTimeout(async () => {
        await initiateScraper();
      }, randomTimeout);
    }
  } catch (e) {
    console.log(e);
    notifier.notify(e);
  }
}

const getPS5 = async (sites) => {
  let browser = null;

  try {
    enchantPuppeteer(); //prevent request already handled error

    const torPorts = [9050, 9052, 9053, 9054, 9055, 9056, 9057, 9058, 9059, 9060, 9061, 9062, 9063, 9064, 9065, 9066, 9067, 9068, 9069, 9070];
    const randomPort = torPorts[Math.floor(Math.random() * 19)];
    let availabilityAndUrl = { available: false, url: null };

    browser = await puppeteer.launch({
      args: [ `--proxy-server=socks5://127.0.0.1:${randomPort}` ],
      headless: true,
      // headless: false,
    });

    //use map so each async fn returns the promise. forEach throws it away
    await Promise.all(sites.map(async (site) => {
      let available;
      const page = await browser.newPage();

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() == 'font' || req.resourceType() == 'image'){
          req.abort();
        }
        else {
          req.continue();
        }
      });
      
      const response = await page.goto(site.url, {
        waitUntil: 'load',
        timeout: 0
      });
  
      const elementHandle = await page.$(site.query);
      available = elementHandle !== null;
  
      console.log(`Searching for PS5 at ** ${site.name} ** on port ${randomPort}. Status: ${response.status()}. Available: ${available}`);

      if (available) {
        availabilityAndUrl.available = true;
        availabilityAndUrl.url = site.url;
      }
  
    }));

    return availabilityAndUrl;
  
  } catch (e) {
    console.log(e);
    notifier.notify(e);
  } finally {
    if (browser) await browser.close();
  }
}

initiateScraper();