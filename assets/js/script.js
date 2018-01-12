var currencies = [], coins = [], panels, updating = 0;

var update = () => {
  getCurrencies();
}

let getCurrencyImages = () => {
  $.each($('.panel'), (i, e) => {
    $(e).children('.coin-img').css('background-image', `url(https://files.coinmarketcap.com/static/img/coins/64x64/${$(e).data('type')}.png)`);
  });
}

let addToList = c => {
  $('#currencies').append(`
    <div class="panel" data-type="${c.id}">
      <div class="coin-img" style="background-image: url(https://files.coinmarketcap.com/static/img/coins/64x64/${c.id}.png)"></div>
      <input class="amount" type="number" value="${c.amount ? c.amount : 1}">
      <span>${c.symbol}</span>
      <span style="margin: 0 .25em;">=</span>
      <span class="value">0</span>
      <span class="currency">USD</span>
      <div style="display:flex;align-items:center;margin-left: .75em;">
        <button class="btn emerald" onclick="save($(this))">
          <i class="fa fa-save"></i>
        </button>
        <button class="btn alizarin" onclick="remove($(this))">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    </div>
  `);
}

let config = (() => {
  if (!JSON.parse(localStorage.getItem('config'))) {
    let c = {
      "settings": {
        "decimals": "2",
        "autoRefresh": "30"
      },
      "coinList": []
    }
    localStorage.setItem('config', JSON.stringify(c));
    return c;
  }

  else {
    let c = JSON.parse(localStorage.getItem('config'));
    c.coinList.forEach(coin => {
      addToList(coin);
    });
    return c;
  }
})();

var save = e => {
  let panel = $(e).closest('.panel');
  config.coinList[$(panel).index()].amount = Number($(panel).children('input.amount').val());
  localStorage.setItem('config', JSON.stringify(config));
}

var remove = e => {
  let panel = $(e).closest('.panel');
  config.coinList.splice($(panel).index(), 1);
  localStorage.setItem('config', JSON.stringify(config));
  $(panel).remove();
  if (config.coinList.length < 1) {    
    $('#get-currencies').css('display', 'none');
    $('#currency-alert').css('display', 'flex');
  }

}

let getCurrencies = () => {
  if (config.coinList.length > 0) {
    panels = $('.panel'); // Get panels
    $('#btn-update').addClass("disabled").prop('disabled', true).html(`
      <i class="fa fa-refresh fa-spin margin-right"></i>UPDATING
    `);
    $.each($('.panel'), (i, e) => { // For each panel...
      let type = $(e).data('type'); // Get panel type
      if (!currencies.includes(type)) { // Add to currency list and get infos
        currencies.push(type);
      }
    });
    getCryptoInfo();
  }
}

let getCryptoInfo = () => {
  currencies.forEach(c => {
    $.ajax({
      url: `https://api.coinmarketcap.com/v1/ticker/${c}/`,
      success: s => {
        let price = s[0].price_usd;
        let factor = 1;

        $.each($(`.panel[data-type=${c}]`), (i, e) => { // For each panel...
          let amount = Number($(e).children('.amount').val());
          let result = amount * price;
          $(e).children('.value').text(result.toFixed(config.settings.decimals));
          updating++
        });

        if (updating >= panels.length) {
          $('#btn-update').removeClass("disabled").prop('disabled', false).html(`
            <i class="fa fa-repeat margin-right"></i>FORCE UPDATE
          `);
          updating = 0;
        }
      }
    });
  });

}

var addCurrency = currency => {
  $('#add-alert').removeClass().addClass('alert').hide();

  if ($(currency).val() != '') {
    $('#btn-add').addClass("disabled").prop('disabled', false).html(`
      <i class="fa fa-refresh fa-spin margin-right"></i>PLEASE WAIT...
    `);
    $.ajax({
      url: `https://api.coinmarketcap.com/v1/ticker/${$(currency).val().toLowerCase()}/`,
      success: s => {  
        $('#add-alert').addClass('success').show().html(`      
          <i class="fa fa-check"></i>
          <span>
            <strong>${$(currency).val()}</strong> has been added successfully!
          </span>
        `);
        addToList(s[0]);
        config.coinList.push({
          "id": s[0].id,
          "symbol": s[0].symbol,
          "amount": 1
        });
        $('#get-currencies').css('display', 'flex');
        $('#currency-alert').css('display', 'none');

        localStorage.setItem('config', JSON.stringify(config))
        $(currency).val('');
      },
      error: err => {
        $('#add-alert').addClass('error').show().html(`      
          <i class="fa fa-times"></i>
          <span>
            Currency not found.
          </span>
        `);
      }
    })
      .always(() => {
        $('#btn-add').removeClass("disabled").prop('disabled', false).html(`
          <i class="fa fa-plus margin-right"></i>
        `);
      });
  }

  else {
    $('#add-alert').addClass('error').show().html(`      
      <i class="fa fa-times"></i>
      <span>
        Insert a currency (example: <strong>bitcoin</strong>).
      </span>
    `);
  }
}

$(window).load(() => {
  config.coinList.length > 0 ? $('#get-currencies').css('display', 'flex') : $('#currency-alert').css('display', 'flex');
  
  getCurrencyImages();
  $('.alert').click(e => $(e.target).closest('.alert').hide());
});