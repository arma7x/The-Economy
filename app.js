const APP_VERSION = "1.3.0";

const rankingSets = [
  { 'key': 'AustralianStockExchange', 'text': 'Australia'},
  { 'key': 'BrusselsStockExchange', 'text': 'Belgium'},
  { 'key': 'SaoPauloStockExchange', 'text': 'Brazil'},
  { 'key': 'TorrontoStockExchange', 'text': 'Canada'},
  { 'key': 'PragueStockExchange', 'text': 'Czech Republic'},
  { 'key': 'CopenhagenStockExchange', 'text': 'Denmark'},
  { 'key': 'HelsinkiStockExchange', 'text': 'Finland'},
  { 'key': 'ParisStockExchange', 'text': 'France'},
  { 'key': 'FrankfurtStockExchange', 'text': 'Germany'},
  { 'key': 'AthensStockExchange', 'text': 'Greece'},
  { 'key': 'StockExchangeOfHongKongLimited', 'text': 'Hong Kong'},
  { 'key': 'BudapestStockExchange', 'text': 'Hungary'},
  { 'key': 'BombayStockExchange', 'text': 'India'},
  { 'key': 'JakartaStockExchange', 'text': 'Indonesia'},
  { 'key': 'TelAvivStockExchange', 'text': 'Israel'},
  { 'key': 'TokyoStockExchange', 'text': 'Japan'},
  { 'key': 'MexicanStockExchange', 'text': 'Mexico'},
  { 'key': 'EuronextAmsterdam', 'text': 'Netherlands'},
  { 'key': 'NewZealandStockExchange', 'text': 'New Zealand'},
  { 'key': 'OsloStockExchange', 'text': 'Norway'},
  { 'key': 'LisbonStockExchange', 'text': 'Portugal'},
  { 'key': 'SingaporeExchangeSecuritiesTrading', 'text': 'Singapore'},
  { 'key': 'JohannesburgStockExchange', 'text': 'South Africa'},
  { 'key': 'MercadoContinuoEspanol', 'text': 'Spain'},
  { 'key': 'StockholmStockExchange', 'text': 'Sweden'},
  { 'key': 'SwissExchange', 'text': 'Switzerland'},
  { 'key': 'LondonStockExchange', 'text': 'United Kingdom'},
  { 'key': 'SP500', 'text': 'United States'},
];

const rankingTypes = [
  { 'key': 'percentgainers', 'text': 'Gainers' },
  { 'key': 'percentlosers', 'text': 'Losers' },
  { 'key': 'highestvolume', 'text': 'Movers' }
];

function commarize() {
  if (this >= 1e3) {
    var units = ["K", "M", "B", "T"];
    let unit = Math.floor(((this).toFixed(0).length - 1) / 3) * 3
    var num = (this / ('1e'+unit)).toFixed(2)
    var unitname = units[Math.floor(unit / 3) - 1]
    return num + unitname
  }
  return this.toLocaleString()
}

Number.prototype.commarize = commarize
String.prototype.commarize = commarize

const xhr = function(method, url, data={}, query={}, headers={}) {
  return new Promise((resolve, reject) => {
    var xhttp = new XMLHttpRequest();
    var _url = new URL(url);
    for (var y in query) {
      _url.searchParams.set(y, query[y]);
    }
    url = _url.origin + _url.pathname + '?' + _url.searchParams.toString();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status >= 200 && this.status <= 299) {
          try {
            const response = JSON.parse(xhttp.response);
            resolve({ raw: xhttp, response: response});
          } catch (e) {
            resolve({ raw: xhttp, response: xhttp.responseText});
          }
        } else {
          try {
            const response = JSON.parse(xhttp.response);
            reject({ raw: xhttp, response: response});
          } catch (e) {
            reject({ raw: xhttp, response: xhttp.responseText});
          }
        }
      }
    };
    xhttp.open(method, url, true);
    for (var x in headers) {
      xhttp.setRequestHeader(x, headers[x]);
    }
    if (Object.keys(data).length > 0) {
      xhttp.send(JSON.stringify(data));
    } else {
      xhttp.send();
    }
  });
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

const exchangerate = {
  getSymbols: () => {
    return xhr('GET', 'https://api.exchangerate.host/symbols');
  },
  convert: (from, to) => {
    return xhr('GET', 'https://api.exchangerate.host/convert', {}, {from, to});
  },
  historical: (base, date) => {
    var symbols = ['EUR', 'JPY', 'GBP', 'CHF', 'AUD', 'NZD', 'CAD', 'USD'];
    const idx = symbols.indexOf(base);
    if (idx > -1)
      symbols.splice(idx, 1);
    return xhr('GET', `https://api.exchangerate.host/${date}`, {}, { base, symbols: symbols.join(',') });
  }
}

window.addEventListener("load", function() {

  const dummy = new Kai({
    name: '_dummy_',
    data: {
      title: '_dummy_'
    },
    verticalNavClass: '.dummyNav',
    templateUrl: document.location.origin + '/templates/dummy.html',
    mounted: function() {},
    unmounted: function() {},
    methods: {},
    softKeyText: { left: 'L2', center: 'C2', right: 'R2' },
    softKeyListener: {
      left: function() {},
      center: function() {},
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      }
    }
  });

  const state = new KaiState({
    'commodities': {},
    'currencies': [],
    'bondandrates': {},
    'symbols': {},
  });

  var TIMEOUT = null;

  const historical = new Kai({
    name: 'historical',
    data: {
      title: 'historical',
      amount: '',
      base_unit: '',
      target_date: '',
    },
    verticalNavClass: '.historicalNav',
    templateUrl: document.location.origin + '/templates/historical.html',
    mounted: function() {
      this.$router.setHeaderTitle('Currency Historical Rate');
      document.getElementById("amount").addEventListener("input", this.methods.amountListener);
      document.getElementById("base_unit").addEventListener("input", this.methods.fromListener);
      var dt = new Date();
      const offset = dt.getTimezoneOffset();
      dt = new Date(dt.getTime() - (offset*60*1000));
      this.data.target_date = dt.toISOString().split('T')[0];
      document.getElementById("target_date").innerHTML = 'Date: ' + this.data.target_date;
    },
    unmounted: function() {
      document.getElementById("amount").removeEventListener("input", this.methods.amountListener);
      document.getElementById("base_unit").removeEventListener("input", this.methods.fromListener);
    },
    methods: {
      submit: function() {
        if (this.data.base_unit == '') {
          this.$router.showDialog('Alert', 'Please select a valid Base unit', null, 'Close', () => {}, ' ', () => {}, ' ', null, () => {});
          return;
        }
        this.$router.showLoading();
        exchangerate.historical(this.data.base_unit, this.data.target_date)
        .then(data => {
          var amount = 1;
          try {
            amount = JSON.parse(this.data.amount);
          } catch(e) {}
          var lis = [];
          for (var x in data.response.rates) {
            lis.push(`<div style="margin:2px 0;display:flex;flex-direction:row;justify-content:space-between;align-items:center;">
                <div>${this.data.base_unit} ${amount.toFixed(3)}</div>
                <div>${x} ${(data.response.rates[x] * amount).toFixed(3)}</div>
              </div>`);
          }
          const text = `<div>${lis.join('')}</div>`;
          this.$router.showDialog(`Result for ${this.data.target_date}`, text, null, 'Close', () => {}, ' ', () => {}, ' ', null, () => {});
        })
        .catch(err => {
          console.log(err);
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      amountListener: function(evt) {
        this.data.amount = evt.target.value;
      },
      search: function(value) {
        var list = [];
        for (var i in this.$state.getState('symbols')) {
          const n = this.$state.getState('symbols')[i];
          if (n.description.toLowerCase().indexOf(value) > -1 || n.code.toLowerCase().indexOf(value) > -1) {
            n.text = n.code;
            n.subtext = n.description;
            list.push(n);
          }
        }
        return list;
      },
      fromListener: function(evt) {
        if (TIMEOUT) {
          clearTimeout(TIMEOUT);
          TIMEOUT = null;
        }
        TIMEOUT = setTimeout(() => {
          TIMEOUT = null;
          if (this.$router.stack[this.$router.stack.length - 1].name !== 'historical')
            return;
          var value = evt.target.value;
          if (value != '' || value != null) {
            value = value.toLowerCase();
            var list = this.methods.search(value);
            if (list.length <= 0) {
              if (evt.target.id === 'base_unit')
                this.data.base_unit = '';
              this.$router.showDialog('Alert', 'Not Found', null, 'Close', () => {}, ' ', () => {}, ' ', null, () => {});
              return;
            }
            this.$router.showOptionMenu('Currency Unit', list, 'SELECT', (selected) => {
              evt.target.value = selected.description;
              if (evt.target.id === 'base_unit')
                this.data.base_unit = selected.code;
            }, () => {}, -1);
          }
        }, 1000);
      },
      selectDate: function() {
        const d = this.data.target_date.split('-');
        this.$router.showDatePicker(parseInt(d[0]), parseInt(d[1]), parseInt(d[2]), (dt) => {
          if (dt > new Date())
            return;
          const offset = dt.getTimezoneOffset();
          dt = new Date(dt.getTime() - (offset*60*1000));
          this.data.target_date = dt.toISOString().split('T')[0];
          document.getElementById("target_date").innerHTML = 'Date: ' + this.data.target_date;
        }, undefined);
      }
    },
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          if (listNav[this.verticalNavIndex]) {
            listNav[this.verticalNavIndex].click();
          }
        }
      },
      right: function() {}
    },
    softKeyInputFocusText: { left: 'Clear', center: 'NEXT', right: 'Back' },
    softKeyInputFocusListener: {
      left: function() {
        const dom = document.activeElement;
        switch (dom.id) {
          case 'amount':
            document.getElementById("amount").value = '';
            this.data.amount = '';
            break;
          case 'base_unit':
            document.getElementById("base_unit").value = '';
            this.data.base_unit = '';
            break;
        }
        if (dom)
          dom.value = '';
      },
      center: function() {
        this.navigateListNav(1);
      },
      right: function() {
        document.activeElement.blur();
        this.$router.pop();
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      }
    }
  });

  const convert = new Kai({
    name: 'convert',
    data: {
      title: 'convert',
      amount: '',
      from_unit: '',
      to_unit: '',
    },
    verticalNavClass: '.convertNav',
    templateUrl: document.location.origin + '/templates/convert.html',
    mounted: function() {
      this.$router.setHeaderTitle('Currency Converter');
      document.getElementById("amount").addEventListener("input", this.methods.amountListener);
      document.getElementById("from_unit").addEventListener("input", this.methods.fromListener);
      document.getElementById("to_unit").addEventListener("input", this.methods.fromListener);
    },
    unmounted: function() {
      document.getElementById("amount").removeEventListener("input", this.methods.amountListener);
      document.getElementById("from_unit").removeEventListener("input", this.methods.fromListener);
      document.getElementById("to_unit").removeEventListener("input", this.methods.fromListener);
    },
    methods: {
      submit: function() {
        if (this.data.from_unit == '' || this.data.to_unit == '') {
          this.$router.showDialog('Alert', 'Please select a valid From/To unit', null, 'Close', () => {}, ' ', () => {}, ' ', null, () => {});
          return;
        }
        this.$router.showLoading();
        exchangerate.convert(this.data.from_unit, this.data.to_unit)
        .then(data => {
          var amount = 1;
          try {
            amount = JSON.parse(this.data.amount);
          } catch(e) {}
          const text = `<div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;"><span>${data.response.query.from} ${parseFloat(amount).toFixed(4)}</span><span>&#8652;</span><span>${data.response.query.to} ${parseFloat(amount * data.response.result).toFixed(4)}</span></div>`;
          this.$router.showDialog(`Result as ${data.response.date}`, text, null, 'Close', () => {}, ' ', () => {}, ' ', null, () => {});
        })
        .catch(err => {
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      amountListener: function(evt) {
        this.data.amount = evt.target.value;
      },
      search: function(value) {
        var list = [];
        for (var i in this.$state.getState('symbols')) {
          const n = this.$state.getState('symbols')[i];
          if (n.description.toLowerCase().indexOf(value) > -1 || n.code.toLowerCase().indexOf(value) > -1) {
            n.text = n.code;
            n.subtext = n.description;
            list.push(n);
          }
        }
        return list;
      },
      fromListener: function(evt) {
        if (TIMEOUT) {
          clearTimeout(TIMEOUT);
          TIMEOUT = null;
        }
        TIMEOUT = setTimeout(() => {
          TIMEOUT = null;
          if (this.$router.stack[this.$router.stack.length - 1].name !== 'convert')
            return;
          var value = evt.target.value;
          if (value != '' || value != null) {
            value = value.toLowerCase();
            var list = this.methods.search(value);
            if (list.length <= 0) {
              if (evt.target.id === 'from_unit')
                this.data.from_unit = '';
              else if (evt.target.id === 'to_unit')
                this.data.to_unit = '';
              this.$router.showDialog('Alert', 'Not Found', null, 'Close', () => {}, ' ', () => {}, ' ', null, () => {});
              return;
            }
            this.$router.showOptionMenu('Currency Unit', list, 'SELECT', (selected) => {
              evt.target.value = selected.description;
              if (evt.target.id === 'from_unit')
                this.data.from_unit = selected.code;
              else if (evt.target.id === 'to_unit')
                this.data.to_unit = selected.code;
            }, () => {}, -1);
          }
        }, 1000);
      },
    },
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          if (listNav[this.verticalNavIndex]) {
            listNav[this.verticalNavIndex].click();
          }
        }
      },
      right: function() {}
    },
    softKeyInputFocusText: { left: 'Clear', center: 'NEXT', right: 'Back' },
    softKeyInputFocusListener: {
      left: function() {
        const dom = document.activeElement;
        switch (dom.id) {
          case 'amount':
            document.getElementById("amount").value = '';
            this.data.amount = '';
            break;
          case 'from_unit':
            document.getElementById("from_unit").value = '';
            this.data.from_unit = '';
            break;
          case 'to_unit':
            document.getElementById("to_unit").value = '';
            this.data.to_unit = '';
            break;
        }
        if (dom)
          dom.value = '';
      },
      center: function() {
        this.navigateListNav(1);
      },
      right: function() {
        document.activeElement.blur();
        this.$router.pop();
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      }
    }
  });

  function renderEnergy(UL, data) {
    var i = 0;
    for (var d in data) {
      const name = document.createElement("DIV");
      name.innerHTML = `<b>${data[d].name[0]}</b>`;
      name.style = "margin-top:2px;";
      const last_price = document.createElement("DIV");
      last_price.innerHTML = `Last Price: <small><b>${data[d].last_price[1]} ${data[d].last_price[0]}</b></small>`;
      last_price.style = "margin-top:2px;";
      const todays_change = document.createElement("DIV");
      todays_change.innerHTML = `Today's Change: <small><b>${data[d].last_price[1]} ${data[d].todays_change[0]}, ${data[d].todays_change[1]}</b></small>`;
      todays_change.style = "margin-top:2px;margin-bottom:4px;";
      const trend = document.createElement("DIV");
      trend.style = data[d]['1_year_trend'].replace('//markets', 'https://markets');
      const low = document.createElement("DIV");
      low.innerHTML = `Low: <small><b>${data[d].last_price[1]} ${data[d].low[0]}, ${data[d].low[1]}</b></small>`;
      low.style = "margin-top:2px;";
      const high = document.createElement("DIV");
      high.innerHTML = `High: <small><b>${data[d].last_price[1]} ${data[d].high[0]}, ${data[d].high[1]}</b></small>`;
      high.style = "margin-top:2px;";
      const date = document.createElement("DIV");
      date.innerHTML = `<small><b>${data[d].name[1]}</b></small>`;
      const li = document.createElement("LI");
      li.appendChild(name);
      li.appendChild(last_price);
      li.appendChild(todays_change);
      li.appendChild(trend);
      li.appendChild(low);
      li.appendChild(high);
      li.appendChild(date);
      li.style = 'padding:2px; border-bottom: 1px solid #c0c0c0;'
      UL.appendChild(li);
      i++;
    }
  }

  const energyTab = new Kai({
    name: 'Energy',
    data: {
      title: '_energyTab_',
    },
    templateUrl: document.location.origin + '/templates/tabs/energyTab.html',
    mounted: function() {
      const t = document.getElementById('__kai_tab__');
      t.classList.remove('kui-tab-h-88');
      t.classList.add('kui-tab-h-60');
      const UL = document.getElementById('energy-tab');
      while(UL.firstChild) {
        UL.removeChild(UL.firstChild);
      }
      const data = this.$state.getState('commodities')['energy'];
      renderEnergy(UL, data);
    },
    unmounted: function() {},
    methods: {},
  });

  const metalsTab = new Kai({
    name: 'Metals',
    data: {
      title: '_metalsTab_'
    },
    templateUrl: document.location.origin + '/templates/tabs/metalsTab.html',
    mounted: function() {
      const t = document.getElementById('__kai_tab__');
      t.classList.remove('kui-tab-h-88');
      t.classList.add('kui-tab-h-60');
      const UL = document.getElementById('metals-tab');
      while(UL.firstChild) {
        UL.removeChild(UL.firstChild);
      }
      const data = this.$state.getState('commodities')['metals'];
      renderEnergy(UL, data);
    },
    unmounted: function() {},
  });

  const agricultureTab = new Kai({
    name: 'Agriculture',
    data: {
      title: '_agricultureTab_'
    },
    templateUrl: document.location.origin + '/templates/tabs/agricultureTab.html',
    mounted: function() {
      const t = document.getElementById('__kai_tab__');
      t.classList.remove('kui-tab-h-88');
      t.classList.add('kui-tab-h-60');
      const UL = document.getElementById('agriculture-tab');
      while(UL.firstChild) {
        UL.removeChild(UL.firstChild);
      }
      const data = this.$state.getState('commodities')['agricultureandlumber'];
      renderEnergy(UL, data);
    },
    unmounted: function() {},
  });

  const commoditiesPriceTab = Kai.createTabNav('commoditiesPriceTab', '.commoditiesPriceTabNav', [energyTab, metalsTab, agricultureTab]);

  const interbankratesovernightTab = new Kai({
    name: 'Interbank Rates(overnight)',
    data: {
      title: 'interbankratesovernight',
      rates: []
    },
    verticalNavClass: '.rateNav',
    template: `
      <div class="kui-flex-wrap">
      <style>.kui-software-key{height:0px}#__kai_router__{height:266px!important;}#__kai_tab__{height:calc(100vh - 58px) !important}.kui-router-m-bottom{margin-bottom:0px!important;}</style>
      <ul class="kui-list kai-container">
        {{#rates}}
        <li class="rateNav kui-divider">
          <div style="width:100%;">
            <div><h5>{{ name }}</h5></div>
            <div class="kui-row-center" style="width:100%;margin:2px 0px;font-size:87%;">
              <small>Latest: <b>{{ latest }}</b></small>
              <small style="text-align:right;">Today's change: <b>{{ today }}</b></small>
            </div>
            <div class="kui-row-center" style="width:100%;margin:2px 0px;font-size:87%;">
              <small>1 week ago: <b>{{ week }}</b></small>
              <small style="text-align:right;">1 month ago: <b>{{ week }}</b></small>
            </div>
          </div>
        </li>
        {{/rates}}
      </ul>
    </div>
    `,
    mounted: function() {
      setTimeout(() => {
        const t = document.getElementById('__kai_tab__');
        t.classList.remove('kui-tab-h-88');
        t.classList.add('kui-tab-h-60');
      }, 100);
      const rates = [];
      this.$state.getState('bondandrates')['interbankratesovernight'].forEach((rate) => {
        rate.name = rate['Interbank lender']
        rate.latest = rate['Latest']
        rate.today = rate["Today's change"]
        rate.week = rate['1 week ago']
        rate.month = rate['1 month ago']
        rates.push(rate);
      });
      this.setData({rates: rates});
    },
    unmounted: function() {},
    dPadNavListener: {
      arrowUp: function() {
        if (this.verticalNavIndex <= 0)
          return
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        if (this.verticalNavIndex === this.data.rates.length - 1)
          return
        this.navigateListNav(1);
      }
    }
  });

  const officialinterestratesTab = new Kai({
    name: 'Official Interest Rates',
    data: {
      title: 'officialinterestrates',
      rates: []
    },
    verticalNavClass: '.rateNav',
    template: `
      <div class="kui-flex-wrap">
      <style>.kui-software-key{height:0px}#__kai_router__{height:266px!important;}#__kai_tab__{height:calc(100vh - 58px) !important}.kui-router-m-bottom{margin-bottom:0px!important;}</style>
      <ul class="kui-list kai-container">
        {{#rates}}
        <li class="rateNav kui-divider">
          <div style="width:100%;">
            <div><h5>{{ name }}</h5></div>
            <div class="kui-row-center" style="width:100%;margin:2px 0px;font-size:87%;">
              <small>Current: <b>{{ current }}</b></small>
              <small style="text-align:right;">Previous Rate: <b>{{ previous }}</b></small>
            </div>
            <div class="kui-row-center" style="width:100%;margin:2px 0px;font-size:87%;">
              <small>Since: <b>{{ since }}</b></small>
            </div>
          </div>
        </li>
        {{/rates}}
      </ul>
    </div>
    `,
    mounted: function() {
      setTimeout(() => {
        const t = document.getElementById('__kai_tab__');
        t.classList.remove('kui-tab-h-88');
        t.classList.add('kui-tab-h-60');
      }, 100);
      const rates = [];
      this.$state.getState('bondandrates')['officialinterestrates'].forEach((rate) => {
        rate.name = rate['Lender']
        rate.current = rate['Current']
        rate.previous = rate["Previous rate"]
        rate.since = rate['Since date']
        rates.push(rate);
      });
      this.setData({rates: rates});
    },
    unmounted: function() {},
    dPadNavListener: {
      arrowUp: function() {
        if (this.verticalNavIndex <= 0)
          return
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        if (this.verticalNavIndex === this.data.rates.length - 1)
          return
        this.navigateListNav(1);
      }
    }
  });

  const marketratesTab = new Kai({
    name: 'Market Rates',
    data: {
      title: 'marketrates',
      rates: []
    },
    verticalNavClass: '.rateNav',
    template: `
      <div class="kui-flex-wrap">
      <style>.kui-software-key{height:0px}#__kai_router__{height:266px!important;}#__kai_tab__{height:calc(100vh - 58px) !important}.kui-router-m-bottom{margin-bottom:0px!important;}</style>
      <ul class="kui-list kai-container">
        {{#rates}}
        <li class="rateNav kui-divider">
          <div style="width:100%;">
            <div><h5>{{ name }} Bonds</h5></div>
            <div class="kui-row-center" style="width:100%;margin:2px 0px;font-size:87%;">
              <small>Latest: <b>{{ latest }}</b></small>
              <small style="text-align:right;">Today's change: <b>{{ today }}</b></small>
            </div>
            <div class="kui-row-center" style="width:100%;margin:2px 0px;font-size:87%;">
              <small>1 week ago: <b>{{ week }}</b></small>
              <small style="text-align:right;">1 month ago: <b>{{ week }}</b></small>
            </div>
          </div>
        </li>
        {{/rates}}
      </ul>
    </div>
    `,
    mounted: function() {
      setTimeout(() => {
        const t = document.getElementById('__kai_tab__');
        t.classList.remove('kui-tab-h-88');
        t.classList.add('kui-tab-h-60');
      }, 100);
      const rates = [];
      this.$state.getState('bondandrates')['marketrates'].forEach((rate) => {
        rate.name = rate['Bonds']
        rate.latest = rate['Latest']
        rate.today = rate["Today's change"]
        rate.week = rate['1 week ago']
        rate.month = rate['1 month ago']
        rates.push(rate);
      });
      this.setData({rates: rates});
    },
    unmounted: function() {},
    dPadNavListener: {
      arrowUp: function() {
        if (this.verticalNavIndex <= 0)
          return
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        if (this.verticalNavIndex === this.data.rates.length - 1)
          return
        this.navigateListNav(1);
      }
    }
  });

  const bondAndRatesTab = Kai.createTabNav('bondAndRatesTab', '.bondAndRatesTabNav', [interbankratesovernightTab, officialinterestratesTab, marketratesTab]);

  const createCurrenciesComponent = function(id, conversion_rates) {
    const currency = id.split(' ').join('');
    const nav = makeid();
    return new Kai({
      name: id,
      data: {
        title: id,
        conversion_rates: conversion_rates
      },
      verticalNavClass: '.' + nav,
      template: `
        <div class="kui-flex-wrap">
          <style>.kui-software-key{height:0px}#__kai_router__{height:266px!important;}#__kai_tab__{height:calc(100vh - 58px) !important}.kui-router-m-bottom{margin-bottom:0px!important;}</style>
          <ul id="${currency}" class="kui-list kai-container" style="font-size:14px;width:240px;"></ul>
        </div>`
      ,
      mounted: function() {
        setTimeout(() => {
          const t = document.getElementById('__kai_tab__');
          t.classList.remove('kui-tab-h-88');
          t.classList.add('kui-tab-h-60');
        }, 100);
        const UL = document.getElementById(`${currency}`);
        while (UL.firstChild) {
          UL.removeChild(UL.firstChild);
        }
        var tabIndex = document.getElementById('__kai_router__') ? document.getElementById('__kai_router__').querySelectorAll("[tabIndex").length : document.querySelectorAll("[tabIndex").length;
        for (var x in this.data.conversion_rates) {
          var i = this.data.conversion_rates;
          const LI = document.createElement("LI");
          LI.setAttribute("class", `${nav} kui-divider`);
          LI.setAttribute("tabIndex", tabIndex);
          const DIV = document.createElement("DIV");
          DIV.className = 'kui-row-center';
          DIV.style = 'padding:2px; width:234px;';
          const pr0 = document.createElement("PRE");
          pr0.innerHTML = i[x][0];
          DIV.appendChild(pr0);
          const pr1 = document.createElement("PRE");
          pr1.innerHTML = i[x][1];
          DIV.appendChild(pr1);
          LI.appendChild(DIV);
          UL.appendChild(LI);
          tabIndex += 1;
        }
        if (this.verticalNavIndex < 0) {
          this.navigateListNav(1);
        } else {
          this.verticalNavIndex = this.verticalNavIndex - 1;
          this.navigateListNav(1);
        }

      },
      unmounted: function() {},
      dPadNavListener: {
        arrowUp: function() {
          const nav = document.querySelectorAll(this.verticalNavClass);
          if (!nav)
            return
          if (this.verticalNavIndex === 0)
            return
          this.navigateListNav(-1);
        },
        arrowDown: function() {
          const nav = document.querySelectorAll(this.verticalNavClass);
          if (!nav)
            return
          if (this.verticalNavIndex === (nav.length - 1))
            return
          this.navigateListNav(1);
        }
      }
    });
  }

  const createCurrencyTab = function(data) {
    var tabs = [];
    for (var x in data) {
      tabs.push(createCurrenciesComponent(data[x][0][1], data[x].slice(1, data[x].length)));
    }
    return Kai.createTabNav('currencyTab', '.currencyTabNav', tabs);
  }

  const equityQuotePage = function($router, rankingSet, rankingType, title) {
    $router.showLoading();
    xhr('GET', 'https://malaysiaapi.herokuapp.com/ft/api/v1/equities', {}, {'rankingType': rankingType, 'rankingSet': rankingSet})
    .then((ok) => {
      const data = []
      ok.response.data.forEach((i) => {
        i._last = `${i.Last[1]} ${i.Last[0]}`;
        const _f = i.Change[0];
        i._change = _f + i.Change.slice(1).split(_f).join(` ${_f}`);
        i._listing = `${i.Listing[0]}(${i.Listing[1]})`
        data.push(i);
      });
      $router.push(
        new Kai({
          name: 'equityQuotePage',
          data: {
            title: 'equityQuotePage',
            data: data,
          },
          verticalNavClass: '.equityQuoteNav',
          template: `
            <div class="kui-flex-wrap">
              <style>.kui-software-key{height:0px}#__kai_router__{height:266px!important;}.kui-router-m-bottom{margin-bottom:0px!important;}</style>
              <ul class="kui-list kai-container">
                {{#data}}
                <li class="equityQuoteNav kui-divider">
                  <div style="width:100%;">
                    <div><h5>{{ _listing }}</h5></div>
                    <div style="margin: 0px 0 2px 0px;"><small>Change: <b>{{ _change }}</b></small></div>
                    <div class="kui-row-center" style="margin: 0px">
                      <small>Last: <b>{{ _last }}</b></small>
                      <small>Volume: <b>{{ Volume }}</b></small>
                    </div>
                  </div>
                </li>
                {{/data}}
              </ul>
            </div>`,
          mounted: function() {
            $router.setHeaderTitle(title);
          },
          unmounted: function() {},
          methods: {},
          softKeyText: { left: '', center: '', right: '' },
          softKeyListener: {
            left: function() {},
            center: function() {},
            right: function() {}
          },
          dPadNavListener: {
            arrowUp: function() {
              if (this.verticalNavIndex <= 0)
                return
              this.navigateListNav(-1);
            },
            arrowDown: function() {
              if (this.verticalNavIndex === data.length - 1)
                return
              this.navigateListNav(1);
            }
          }
        })
      );
    })
    .catch((err) => {
      console.log(err);
      $router.showToast('Error');
    })
    .finally(() => {
      $router.hideLoading();
    })
  }

  const equities = new Kai({
    name: 'equities',
    data: {
      title: 'equities',
      data: rankingSets,
    },
    verticalNavClass: '.equitiesNav',
    template: `
      <div class="kui-flex-wrap">
        <ul class="kui-list kai-container">
          {{#data}}
          <li class="equitiesNav kui-divider">
            <div>
            <pre>{{ text }}</pre>
              <small><pre>{{ key }}</pre></small>
            </div>
          </li>
          {{/data}}
        </ul>
      </div>`,
    mounted: function() {
      this.$router.setHeaderTitle('Equities');
    },
    unmounted: function() {},
    methods: {},
    softKeyText: { left: 'Losers', center: 'Gainers', right: 'Movers' },
    softKeyListener: {
      left: function() {
        if (rankingSets[this.verticalNavIndex]) {
          equityQuotePage(this.$router, rankingSets[this.verticalNavIndex].key, 'percentlosers', `${rankingSets[this.verticalNavIndex].text} - Losers`);
        }
      },
      center: function() {
        if (rankingSets[this.verticalNavIndex]) {
          equityQuotePage(this.$router, rankingSets[this.verticalNavIndex].key, 'percentgainers', `${rankingSets[this.verticalNavIndex].text} - Gainers`);
        }
      },
      right: function() {
        if (rankingSets[this.verticalNavIndex]) {
          equityQuotePage(this.$router, rankingSets[this.verticalNavIndex].key, 'highestvolume', `${rankingSets[this.verticalNavIndex].text} - Movers`);
        }
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        if (this.verticalNavIndex <= 0)
          return
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        if (this.verticalNavIndex === rankingSets.length - 1)
          return
        this.navigateListNav(1);
      }
    }
  });

  const getGovBondsSpreadsPage = function($router, data) {
    data.forEach((d) => {
      d.country = d['Country']
      d.latest_yield = d['Latest yield']
      d.sp_vs_bu = d['Spread vs bund']
      d.sp_vs_tn = d['Spread vs T-notes']
    });
    $router.push(
      new Kai({
        name: 'getGovBondsSpreads',
        data: {
          title: 'getGovBondsSpreads',
          data: data,
        },
        verticalNavClass: '.gbsNav',
        templateUrl: document.location.origin + '/templates/getGovBondsSpreads.html',
        mounted: function() {
          $router.setHeaderTitle('Government Bonds Spreads');
        },
        unmounted: function() {},
        methods: {},
        softKeyText: { left: '', center: '', right: '' },
        softKeyListener: {
          left: function() {},
          center: function() {},
          right: function() {}
        },
        dPadNavListener: {
          arrowUp: function() {
            if (this.verticalNavIndex <= 0)
              return
            this.navigateListNav(-1);
          },
          arrowDown: function() {
            if (this.verticalNavIndex === data.length - 1)
              return
            this.navigateListNav(1);
          }
        }
      })
    );
  }

  const cryptoCurrencyPage = function(markets) {
    markets.forEach((value) => {
      for(var x in value) {
        var v = parseFloat(value[x]);
        if (x === 'changePercent24Hr' || x === 'priceUsd' || x === 'vwap24Hr')
          value[x] = Math.round(v * 100) / 100;
        else if (v >= 0)
          value[x] = v.commarize();
      }
    });
    return new Kai({
      name: 'cryptoCurrencyPage',
      data: {
        idx: 0,
        current: markets[0],
      },
      templateUrl: document.location.origin + '/templates/cryptocurrencies.html',
      mounted: function() {
        this.methods.renderCenterText();
      },
      methods: {
        renderCenterText: function() {
          this.$router.setHeaderTitle(`Rank ${this.data.current.rank} - ${this.data.current.symbol}`);
        },
        search: function(keyword) {
          if (keyword != '') {
            keyword = keyword.toLowerCase();
            const idx = markets.findIndex((coin) => {
              return coin.name.toLowerCase().indexOf(keyword) > -1 || coin.symbol.toLowerCase().indexOf(keyword) > -1;
            });
            if (idx === -1) {
              this.$router.showToast('Not Found');
            } else {
              this.setData({ idx: idx, current: markets[idx] });
              this.methods.renderCenterText();
            }
          }
        },
        jump: function(idx) {
          try {
            const i = JSON.parse(idx) - 1;
            if (!markets[i]) {
              this.$router.showToast('Not Found');
              return
            }
            this.setData({ idx: i, current: markets[i] });
            this.methods.renderCenterText();
          } catch(err) {
            this.$router.showToast('Not Found');
          }
        },
        showInputDialog: function(title, placeholder, type, cb = () => {}) {
          const searchDialog = Kai.createDialog(title, `<div><input id="keyword-input" type="${type}" placeholder="${placeholder}" class="kui-input"/></div>`, null, '', undefined, '', undefined, '', undefined, undefined, this.$router);
          searchDialog.mounted = () => {
            setTimeout(() => {
              setTimeout(() => {
                this.$router.setSoftKeyText('Cancel' , '', 'Go');
              }, 103);
              const KEYWORD = document.getElementById('keyword-input');
              if (!KEYWORD) {
                return;
              }
              KEYWORD.focus();
              KEYWORD.value = '';
              KEYWORD.addEventListener('keydown', (evt) => {
                switch (evt.key) {
                  case 'Backspace':
                  case 'EndCall':
                    if (document.activeElement.value.length === 0) {
                      this.$router.hideBottomSheet();
                      setTimeout(() => {
                        KEYWORD.blur();
                        this.methods.renderCenterText();
                      }, 100);
                    }
                    break
                  case 'SoftRight':
                    setTimeout(() => {
                      KEYWORD.blur();
                      cb(KEYWORD.value);
                      this.$router.hideBottomSheet();
                      this.methods.renderCenterText();
                    }, 100);
                    break
                  case 'SoftLeft':
                    setTimeout(() => {
                      KEYWORD.blur();
                      this.$router.hideBottomSheet();
                      this.methods.renderCenterText();
                    }, 100);
                    break
                }
              });
            });
          }
          searchDialog.dPadNavListener = {
            arrowUp: function() {
              const KEYWORD = document.getElementById('keyword-input');
              KEYWORD.focus();
            },
            arrowDown: function() {
              const KEYWORD = document.getElementById('keyword-input');
              KEYWORD.focus();
            }
          }
          this.$router.showBottomSheet(searchDialog);
        }
      },
      softKeyText: { left: 'Help', center: 'SEARCH', right: 'Jump' },
      softKeyListener: {
        left: function() {
           this.$router.showDialog('Info', `Use Arrow Left or Arrow Right to navigate`, null, ' ', () => {}, 'Close', () => {}, ' ', () => {}, () => {});
        },
        center: function() {
          this.methods.showInputDialog('Keyword', 'Name or symbol', 'text', this.methods.search);
        },
        right: function() {
          this.methods.showInputDialog('Jump', 'Rank', 'tel', this.methods.jump);
        }
      },
      unmounted: function() {

      },
      dPadNavListener: {
        arrowLeft: function() {
          if (this.data.idx === 0)
            return
          this.setData({ idx: this.data.idx - 1, current: markets[this.data.idx - 1] });
          this.methods.renderCenterText();
        },
        arrowRight: function() {
          if (this.data.idx === markets.length - 1)
            return
          this.setData({ idx: this.data.idx + 1, current: markets[this.data.idx + 1] });
          this.methods.renderCenterText();
        },
      }
    });
  }

  const changelogs = new Kai({
    name: 'changelogs',
    data: {
      title: 'changelogs'
    },
    templateUrl: document.location.origin + '/templates/changelogs.html',
    mounted: function() {
      this.$router.setHeaderTitle('Changelogs');
    },
    unmounted: function() {},
    methods: {},
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {},
      right: function() {}
    }
  });

  const Home = new Kai({
    name: 'home',
    data: {
      title: 'home',
      opts: []
    },
    verticalNavClass: '.homeNav',
    components: [],
    templateUrl: document.location.origin + '/templates/home.html',
    mounted: function() {
      exchangerate.getSymbols()
      .then(data => {
        try {
          this.$state.setState('symbols', data.response.symbols);
        } catch (e) {}
      }).catch(e=>{});
      this.$router.setHeaderTitle('The Economy');
      xhr('GET', 'https://malaysiaapi.herokuapp.com');
      const CURRENT_VERSION = window.localStorage.getItem('APP_VERSION');
      if (APP_VERSION != CURRENT_VERSION) {
        this.$router.showToast(`Updated to version ${APP_VERSION}`);
        this.$router.push('changelogs');
        window.localStorage.setItem('APP_VERSION', APP_VERSION);
      }
    },
    unmounted: function() {

    },
    methods: {
      selected: function(val) {
        this.setData({ selected: val.text });
      },
      getCommodities: function() {
        this.$router.showLoading();
        xhr('GET', 'https://malaysiaapi.herokuapp.com/ft/api/v1/commodities')
        .then((ok) => {
          this.$state.setState('commodities', ok.response.data);
          this.$router.setHeaderTitle('Commodities Price');
          this.$router.push('commoditiesPriceTab');
        })
        .catch((err) => {
          console.log(err);
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      getCurrencies: function(val) {
        var vals = val.split('|');
        this.$router.showLoading();
        xhr('GET', 'https://malaysiaapi.herokuapp.com/ft/api/v1/currencies', {}, {'group': vals[0]})
        .then((ok) => {
          this.$router.setHeaderTitle(vals[1]);
          this.$router.push(createCurrencyTab(ok.response.data));
        })
        .catch((err) => {
          console.log(err);
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      getCryptoCurrencies: function() {
        this.$router.showLoading();
        xhr('GET', 'https://api.coincap.io/v2/assets', {}, {'limit': 100})
        .then((ok) => {
          this.$router.push(cryptoCurrencyPage(ok.response.data));
        })
        .catch((err) => {
          console.log(err);
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      getBondAndRates: function() {
        this.$router.showLoading();
        xhr('GET', 'https://malaysiaapi.herokuapp.com/ft/api/v1/bondsandrates')
        .then((ok) => {
          this.$state.setState('bondandrates', ok.response.data);
          this.$router.setHeaderTitle('Bond And Rates');
          this.$router.push('bondAndRatesTab');
        })
        .catch((err) => {
          console.log(err);
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      getGovBondsSpreads: function() {
        this.$router.showLoading();
        xhr('GET', 'https://malaysiaapi.herokuapp.com/ft/api/v1/governmentbondsspreads')
        .then((ok) => {
          getGovBondsSpreadsPage(this.$router, ok.response.data);
        })
        .catch((err) => {
          console.log(err);
          this.$router.showToast('Error');
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      gotoEquities: function() {
        this.$router.push('equities');
      }
    },
    softKeyText: { left: 'Menu', center: 'SELECT', right: 'Exit' },
    softKeyListener: {
      left: function() {
        var menu = [
          {'text': 'QOTD'},
          {'text': 'Currency Converter'},
          {'text': 'Currency Historical Rates'},
          {'text': 'Changelogs'},
        ]
        this.$router.showOptionMenu('Menu', menu, 'SELECT', (selected) => {
          if (selected.text === 'QOTD') {
            this.$router.showLoading();
            xhr('GET', 'https://malaysiaapi.herokuapp.com/ft/api/v1/qotd')
            .then((ok) => {
              this.$router.showDialog('QOTD', `${ok.response.data[0]}<br><b>-${ok.response.data[1]}</b>`, null, 'Close', () => {}, ' ', () => {}, ' ', () => {}, () => {});
            })
            .catch((err) => {
              console.log(err);
              this.$router.showToast('Error');
            })
            .finally(() => {
              this.$router.hideLoading();
            });
          } else if (selected.text === 'Changelogs') {
            this.$router.push('changelogs');
          } else if (selected.text == 'Currency Converter') {
            this.$router.push('convert');
          } else if (selected.text == 'Currency Historical Rates') {
            this.$router.push('historical');
          }
        }, () => {});
      },
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          listNav[this.verticalNavIndex].click();
        }
      },
      right: function() {
        window.close();
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        if (this.verticalNavIndex <= 0)
          return
        this.navigateListNav(-1);
      },
      arrowDown: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex === listNav.length - 1)
          return
        this.navigateListNav(1);
      },
    }
  });

  const router = new KaiRouter({
    title: 'The Economy',
    routes: {
      'index' : {
        name: 'Home',
        component: Home
      },
      'commoditiesPriceTab' : {
        name: 'commoditiesPriceTab',
        component: commoditiesPriceTab
      },
      'bondAndRatesTab' : {
        name: 'bondAndRatesTab',
        component: bondAndRatesTab
      },
      'convert' : {
        name: 'convert',
        component: convert
      },
      'historical' : {
        name: 'historical',
        component: historical
      },
      'equities' : {
        name: 'equities',
        component: equities
      },
      'changelogs' : {
        name: 'changelogs',
        component: changelogs
      }
    }
  });

  const app = new Kai({
    name: '_APP_',
    data: {},
    templateUrl: document.location.origin + '/templates/template.html',
    mounted: function() {},
    unmounted: function() {},
    router,
    state
  });

  try {
    app.mount('app');
  } catch(e) {
    console.log(e);
  }

  function displayKaiAds() {
    var display = true;
    if (window['kaiadstimer'] == null) {
      window['kaiadstimer'] = new Date();
    } else {
      var now = new Date();
      if ((now - window['kaiadstimer']) < 300000) {
        display = false;
      } else {
        window['kaiadstimer'] = now;
      }
    }
    console.log('Display Ads:', display);
    if (!display)
      return;
    getKaiAd({
      publisher: 'ac3140f7-08d6-46d9-aa6f-d861720fba66',
      app: 'the-economy',
      slot: 'kaios',
      onerror: err => console.error(err),
      onready: ad => {
        ad.call('display')
        ad.on('close', () => {
          app.$router.hideBottomSheet();
          document.body.style.position = '';
        });
        ad.on('display', () => {
          app.$router.hideBottomSheet();
          document.body.style.position = '';
        });
      }
    })
  }

  displayKaiAds();

  document.addEventListener('visibilitychange', function(ev) {
    if (document.visibilityState === 'visible') {
      displayKaiAds();
    }
  });
});
