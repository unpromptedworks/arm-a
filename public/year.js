(function () {
  var $ = function (id) { return document.getElementById(id); };
  var LABEL = { new: 'New moon', first: 'First quarter', full: 'Full moon', last: 'Last quarter' };
  var SYM = { new: '●', first: '◐', full: '○', last: '◑' };
  var fmtDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' });
  var fmtTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
  var fmtMonth = new Intl.DateTimeFormat(undefined, { month: 'long' });
  var thisYear = new Date().getFullYear();

  function render(y) {
    var list = Lunar.phasesBetween(new Date(y, 0, 1), new Date(y + 1, 0, 1));
    var html = '', fulls = 0, news = 0;
    for (var m = 0; m < 12; m++) {
      var rows = list.filter(function (p) { return p.date.getMonth() === m; });
      html += '<h3>' + fmtMonth.format(new Date(y, m, 1)) + '</h3><ul>' + rows.map(function (p) {
        if (p.type === 'full') fulls++;
        if (p.type === 'new') news++;
        return '<li><span class="sym" aria-hidden="true">' + SYM[p.type] + '</span><span>' + LABEL[p.type] +
          '</span><time>' + fmtDay.format(p.date) + ', ' + fmtTime.format(p.date) + '</time></li>';
      }).join('') + '</ul>';
    }
    $('months').innerHTML = html;
    $('title').textContent = 'The moons of ' + y;
    $('count').textContent = news + ' new moons and ' + fulls + ' full moons';
    document.title = 'Moons of ' + y + ' · Lunation Ledger';
  }

  var input = $('year');
  function current() {
    var y = parseInt(input.value, 10);
    return y >= 1900 && y <= 2100 ? y : thisYear;
  }
  function set(y) { y = Math.min(2100, Math.max(1900, y)); input.value = y; render(y); }
  input.addEventListener('change', function () { set(current()); });
  $('prev').addEventListener('click', function () { set(current() - 1); });
  $('next').addEventListener('click', function () { set(current() + 1); });
  $('now').addEventListener('click', function () { set(thisYear); });
  set(thisYear);
})();
