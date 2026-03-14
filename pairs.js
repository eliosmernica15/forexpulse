
(function () {
  var FOREX_PAIRS = [
    { pair: 'EUR/USD', base: 'EUR', quote: 'USD', name: 'Euro / US Dollar', category: 'majors' },
    { pair: 'GBP/USD', base: 'GBP', quote: 'USD', name: 'British Pound / US Dollar', category: 'majors' },
    { pair: 'USD/JPY', base: 'USD', quote: 'JPY', name: 'US Dollar / Japanese Yen', category: 'majors' },
    { pair: 'AUD/USD', base: 'AUD', quote: 'USD', name: 'Australian Dollar / US Dollar', category: 'majors' },
    { pair: 'USD/CHF', base: 'USD', quote: 'CHF', name: 'US Dollar / Swiss Franc', category: 'majors' },
    { pair: 'USD/CAD', base: 'USD', quote: 'CAD', name: 'US Dollar / Canadian Dollar', category: 'majors' },
    { pair: 'NZD/USD', base: 'NZD', quote: 'USD', name: 'New Zealand Dollar / US Dollar', category: 'majors' },
    { pair: 'EUR/GBP', base: 'EUR', quote: 'GBP', name: 'Euro / British Pound', category: 'minors' },
    { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY', name: 'Euro / Japanese Yen', category: 'minors' },
    { pair: 'EUR/CHF', base: 'EUR', quote: 'CHF', name: 'Euro / Swiss Franc', category: 'minors' },
    { pair: 'EUR/AUD', base: 'EUR', quote: 'AUD', name: 'Euro / Australian Dollar', category: 'minors' },
    { pair: 'GBP/JPY', base: 'GBP', quote: 'JPY', name: 'British Pound / Japanese Yen', category: 'minors' },
    { pair: 'GBP/CHF', base: 'GBP', quote: 'CHF', name: 'British Pound / Swiss Franc', category: 'minors' },
    { pair: 'GBP/AUD', base: 'GBP', quote: 'AUD', name: 'British Pound / Australian Dollar', category: 'minors' },
    { pair: 'AUD/JPY', base: 'AUD', quote: 'JPY', name: 'Australian Dollar / Japanese Yen', category: 'minors' },
    { pair: 'AUD/CHF', base: 'AUD', quote: 'CHF', name: 'Australian Dollar / Swiss Franc', category: 'minors' },
    { pair: 'AUD/NZD', base: 'AUD', quote: 'NZD', name: 'Australian Dollar / New Zealand Dollar', category: 'minors' },
    { pair: 'CHF/JPY', base: 'CHF', quote: 'JPY', name: 'Swiss Franc / Japanese Yen', category: 'minors' },
    { pair: 'CAD/JPY', base: 'CAD', quote: 'JPY', name: 'Canadian Dollar / Japanese Yen', category: 'minors' },
    { pair: 'NZD/JPY', base: 'NZD', quote: 'JPY', name: 'New Zealand Dollar / Japanese Yen', category: 'minors' },
  ];

  function searchPairs(query) {
    if (typeof query !== 'string') return FOREX_PAIRS.slice(0, 20);
    var q = query.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!q) return FOREX_PAIRS.slice(0, 20);
    var terms = q.split(/\s+/).filter(Boolean);
    return FOREX_PAIRS.filter(function (p) {
      var pairLower = p.pair.toLowerCase();
      var baseLower = p.base.toLowerCase();
      var quoteLower = p.quote.toLowerCase();
      var nameLower = (p.name || '').toLowerCase();
      for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        var match =
          pairLower.indexOf(term) !== -1 ||
          baseLower.indexOf(term) !== -1 ||
          quoteLower.indexOf(term) !== -1 ||
          nameLower.indexOf(term) !== -1;
        if (!match) return false;
      }
      return true;
    }).slice(0, 20);
  }

  function getPairBySlug(slug) {
    var normalized = (slug || '').toUpperCase().replace(/-/g, '/');
    return FOREX_PAIRS.find(function (p) {
      return p.pair === normalized || p.pair.replace('/', '-') === slug;
    }) || null;
  }

  function getCategories() {
    var categories = [
      { id: 'majors', name: 'Major Pairs', pairs: FOREX_PAIRS.filter(function (p) { return p.category === 'majors'; }) },
      { id: 'minors', name: 'Minor Pairs', pairs: FOREX_PAIRS.filter(function (p) { return p.category === 'minors'; }) },
    ];
    return categories;
  }

  if (typeof window !== 'undefined') {
    window.FOREX_PAIRS = FOREX_PAIRS;
    window.ForexPulsePairs = {
      list: FOREX_PAIRS,
      search: searchPairs,
      getPairBySlug: getPairBySlug,
      getCategories: getCategories,
    };
  }
})();
