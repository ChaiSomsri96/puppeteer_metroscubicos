const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
var MongoClient = require("mongodb").MongoClient;

const results = 1295;
const resultsPerPage = 48;
const maxPages = 40;
const maxResults = 1920;

const scrapeUrl =
  "https://inmuebles.metroscubicos.com/venta/lomas-de-chapultepec-distrito-federal-miguel-hidalgo";
const collection = "propeiedadesVenta";

const pages = Math.round(results / resultsPerPage);

console.log('PAGES::', pages)

async function run() {
  const browser = await puppeteer.launch({
    headless: true //change to true in prod!
  });

  const page = await browser.newPage();

  let pageSection = 1;
  let count = 0;
  for (i = 0; i < pages; i++) {
    if (i === 0) {
      await page.goto(scrapeUrl);
    } else {
      await page.goto(scrapeUrl + "_Desde_" + pageSection);
    }

    await page.content();

    let texts = await page.evaluate(() => {
      let data = [];
      let elements = document.getElementsByClassName("images-viewer");
      for (var element of elements) {
        data.push(element.attributes[2].nodeValue);
      }
      return data;
    });
    texts.map(mlm => {
      fetch(`https://api.mercadolibre.com/items/${mlm}`, {
        method: "get",
        headers: { "Content-Type": "application/json" }
      })
        .then(res => res.json())
        .then(json => {
          MongoClient.connect(
            "mongodb://localhost:27017",
            (err, client) => {
              // Client returned
              var db = client.db("metrosCubicos");
              db.collection(collection).insertOne(json);
            }
          );
          count += 1;
        })
        .catch(err => console.log("it crapped out::", err));
    });
  console.log('PropertyCount::', count);
  }
  await browser.close();
}

run();
