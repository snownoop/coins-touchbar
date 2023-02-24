const { app, BrowserWindow, TouchBar, Menu, Tray, ipcMain } = require('electron')
const axios = require('axios').default;
const fs = require('fs');
const expandTilde = require('expand-tilde');
const path = require("path");

const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar

const COLORS = {
  'BTC': '#F6931B',
  'ETH': '#5C78DF',
  'SOL': '#8E6ED9',
  'MATIC': '#7D43DB',
  'BNB': '#E5AE0D',
  'AVAX': '#DD3F3E',
  'XRP': '#22292F',
  'ADA': '#3569D0',
  'DOGE': '#C7A85A',
  'DOT': '#EF1A7E',
  'SHIB': '#EC432D',
  'NEAR': '#010001',
  'ATOM': '#2E3246',
  'FLOW': '#11EF8A',
  'UNI': '#F30075',
};

const btcButton = new TouchBarButton({
  label: '₿',
  backgroundColor: '#F6931B',
});

const getTickers = (tickersData) => {
  tickersString = tickersData.replace(/\s/g, '');
  return ['BTC'].concat(tickersString.split(',').filter(item => !!item));
};

const getButtons = (tickers) => {
  let buttons = {
    btc: new TouchBarButton({
      label: '₿',
      backgroundColor: COLORS.BTC,
    }),
  }
  tickers.forEach(ticker => {
    if (ticker !== 'BTC') {
      buttons[ticker] = new TouchBarButton({
        label: ticker.toUpperCase(),
        backgroundColor: COLORS[ticker.toUpperCase()] || '#808080',
      });
    }
  });
  return buttons;
};

const getCoinsPrice = async (tickers, buttons) => {
  const res = await axios.get(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${tickers.join(',')}`, {
    headers: {
      'X-CMC_PRO_API_KEY': 'e8b8e828-3aef-4f31-bd9e-6b886f1e72cf'
    },
  });

  const data = res?.data?.data;
  if (!data) return;

  Object.keys(buttons).forEach(buttonTicker => {
    const buttonTickerUppercase = buttonTicker.toUpperCase();
    if (data[buttonTickerUppercase] && data[buttonTickerUppercase][0].quote?.USD?.price) {
      buttons[buttonTicker].label = `${buttonTickerUppercase} ${data[buttonTickerUppercase][0].quote?.USD?.price.toFixed(2)}$`;
    } else {
      buttons[buttonTicker].label = `${buttonTickerUppercase} No price`;
    }
  });
};

let window;
let tray;
let interval;
app.whenReady().then(() => {
  ipcMain.on('getPrices', (event, data) => {
    const reBuildCoinsButtons = () => {
      const tickers = getTickers(data.tickers);
      const buttons = getButtons(tickers);
      const touchBar = new TouchBar({ items: Object.values(buttons) });
      getCoinsPrice(tickers, buttons);
      window.setTouchBar(null);
      window.setTouchBar(touchBar);
    }
    clearInterval(interval);
    reBuildCoinsButtons();
    interval = setInterval(() => {
      reBuildCoinsButtons();
    }, data.interval ? (data.interval * 60 * 1000) : 300000);
  });
  window = new BrowserWindow({
    width: 600,
    height: 420,
    backgroundColor: '#ABABAB',
    title: "Coins Touchbar",
    resizable: false,
    disableHtmlFullscreenWindowResize: true,
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  window.loadFile('src/index.html');
});