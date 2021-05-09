window.addEventListener("load", function() {

  const state = new KaiState({
    'commodities': {},
  });

  const xhr = function(method, url, data={}, query={}, headers={}) {
    return new Promise((resolve, reject) => {
      var xhttp = new XMLHttpRequest({ mozSystem: true });
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
      const UL = document.getElementById('agriculture-tab');
      while(UL.firstChild) {
        UL.removeChild(UL.firstChild);
      }
      const data = this.$state.getState('commodities')['agricultureandlumber'];
      renderEnergy(UL, data);
    },
    unmounted: function() {},
  });


  const Home = new Kai({
    name: '_CHILD_ 1',
    data: {
      title: '_CHILD_ 1',
      opts: []
    },
    verticalNavClass: '.homeNav',
    components: [],
    templateUrl: document.location.origin + '/templates/home.html',
    mounted: function() {
      this.$state.addStateListener('counter', this.methods.listenState);
    },
    unmounted: function() {
      this.$state.removeStateListener('counter', this.methods.listenState);
    },
    methods: {
      listenState: function(data) {
        //this.render()
      },
      selected: function(val) {
        this.setData({ selected: val.text });
      },
      getCommodities: function() {
        this.$router.showLoading();
        xhr('GET', 'http://127.0.0.1:1004/ft/api/v1/commodities')
        .then((ok) => {
          this.$state.setState('commodities', ok.response.data);
          this.$router.push('commoditiesPrice');
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.$router.hideLoading();
        })
      },
      getCurrencies: function(val) {
        console.log(val);
      }
    },
    softKeyText: { left: 'News', center: 'SELECT', right: 'Exit' },
    softKeyListener: {
      left: function() {},
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          listNav[this.verticalNavIndex].click();
        }
      },
      right: function() {}
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        // this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        // this.navigateTabNav(1);
      },
    }
  });
  const commoditiesPriceChild = Kai.createTabNav('_CHILD_ 2', '.child2DemoNav', [energyTab, metalsTab, agricultureTab]);

  const router = new KaiRouter({
    title: 'The Economy',
    routes: {
      'index' : {
        name: 'Home',
        component: Home
      },
      'commoditiesPrice' : {
        name: 'commoditiesPriceChild',
        component: commoditiesPriceChild
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
    //setTimeout(function() {
      //commoditiesPriceChild.mount('app');
    //}, 2000);
  } catch(e) {
    console.log(e);
  }
});
