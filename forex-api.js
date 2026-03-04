/**
 * ForexPulse — forex rates via Frankfurter API
 * https://api.frankfurter.app
 */
(function () {
  var BASE = 'https://api.frankfurter.app';

  /**
   * Fetch latest rates: from one currency to many.
   * e.g. getLatest({ from: 'USD', to: ['EUR', 'GBP', 'JPY', 'AUD'] })
   * returns { base, date, rates: { EUR: 0.92, GBP: 0.79, ... } }
   */
  function getLatest(options, callback) {
    var from = (options && options.from) || 'USD';
    var to = options && options.to;
    var toList = Array.isArray(to) ? to : (to ? [to] : []);
    if (toList.length === 0) {
    }
    var toParam = toList.join(',');
    var url = BASE + '/latest?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(toParam);
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Frankfurter API ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (callback) callback(null, data);
      })
      .catch(function (err) {
        if (callback) callback(err, null);
      });
  }

  /**
   * Get rates for our standard pair list. Returns a map: pair -> { rate, date }.
   * Uses USD as base and requests all needed quote currencies.
   */
  function getRatesForPairs(pairsList, callback) {
    if (!pairsList || pairsList.length === 0) {
    }
    var currencies = {};
    pairsList.forEach(function (p) {
      var pair = typeof p === 'string' ? p : (p && p.pair);
      if (!pair) return;
      var parts = pair.split('/');
      if (parts.length !== 2) return;
      currencies[parts[0]] = true;
      currencies[parts[1]] = true;
    });
    var list = Object.keys(currencies).filter(function (c) { return c !== 'USD'; });
    if (list.length === 0) {
      if (callback) callback(null, {});
      return;
    }
    getLatest({ from: 'USD', to: list }, function (err, data) {
      if (err) {
        if (callback) callback(err, null);
        return;
      }
      var rates = data.rates || {};
      var date = data.date || null;
      var result = {};
      pairsList.forEach(function (p) {
        var pair = typeof p === 'string' ? p : (p && p.pair);
        if (!pair) return;
        var parts = pair.split('/');
        if (parts.length !== 2) return;
        var base = parts[0];
        var quote = parts[1];
        var rate = null;
        if (quote === 'USD') {
          if (base === 'USD') rate = 1;
          else rate = rates[base] != null ? 1 / rates[base] : null;
        } else if (base === 'USD') {
          rate = rates[quote] != null ? rates[quote] : null;
        } else {
          if (rates[base] != null && rates[quote] != null) rate = rates[quote] / rates[base];
        }
        result[pair] = { rate: rate, date: date };
      });
      if (callback) callback(null, result);
    });
  }

  /**
   * Get single pair rate. pair e.g. 'EUR/USD'
   */
  function getPairRate(pair, callback) {
    var parts = (pair || '').split('/');
    if (parts.length !== 2) {
      if (callback) callback(new Error('Invalid pair'), null);
      return;
    }
    getRatesForPairs([pair], function (err, map) {
      if (err) {
        if (callback) callback(err, null);
        return;
      }
      var r = map[pair];
      if (callback) callback(null, r ? r.rate : null, r ? r.date : null);
    });
  }

  if (typeof window !== 'undefined') {
    window.ForexPulseAPI = {
      getLatest: getLatest,
      getRatesForPairs: getRatesForPairs,
      getPairRate: getPairRate,
    };
  }
})();
