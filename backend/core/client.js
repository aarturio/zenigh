const Alpaca = require("@alpacahq/alpaca-trade-api");

const alpacaClient = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true,
});

module.exports = alpacaClient;
