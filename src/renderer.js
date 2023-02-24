var runButton = document.getElementById('run-button');
runButton.addEventListener('click', function() {
  window.electronAPI.getPrices({
    tickers: document.getElementById('tickers').value,
    interval: document.getElementById('interval').value,
  });
});