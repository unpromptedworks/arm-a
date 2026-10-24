(function () {
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  var fmtDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  var fmtTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
  var fmtMonth = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function toInput(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function render(day) {
    var noon = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
    var s = Lunar.state(noon);
    $('moon').innerHTML = moonSVG(s.cycle, 220);
    $('phase').textContent = Lunar.phaseName(s.cycle);
    $('facts').textContent = fmtDate.format(noon) + ' · ' + Math.round(s.lit * 100) + '% lit · ' + s.age.toFixed(1) + ' days old';

    var LABEL = { new: 'New moon', first: 'First quarter', full: 'Full moon', last: 'Last quarter' };
    var CYC = { new: 0, first: 0.25, full: 0.5, last: 0.75 };
    var list = Lunar.phasesBetween(noon, new Date(noon.getTime() + 100 * 86400000)).slice(0, 8);
    $('next').innerHTML = list.map(function (p) {
      return '<li><span class="mini">' + moonSVG(CYC[p.type], 26) + '</span><span>' +
        LABEL[p.type] + '</span><time>' + fmtDate.format(p.date) + ', ' + fmtTime.format(p.date) + '</time></li>';
    }).join('');

    var first = new Date(day.getFullYear(), day.getMonth(), 1);
    $('month').textContent = fmtMonth.format(first);
    var html = '', lead = (first.getDay() + 6) % 7; // Monday first
    for (var i = 0; i < lead; i++) html += '<div></div>';
    var n = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
    var marks = {};
    Lunar.phasesBetween(first, new Date(day.getFullYear(), day.getMonth() + 1, 1)).forEach(function (p) {
      marks[p.date.getDate()] = p;
    });
    for (var d = 1; d <= n; d++) {
      var t = new Date(day.getFullYear(), day.getMonth(), d, 12);
      var st = Lunar.state(t);
      html += '<div class="cell' + (d === day.getDate() ? ' sel' : '') + '" title="' + (marks[d] ? LABEL[marks[d].type] + ', ' + fmtTime.format(marks[d].date) : Lunar.phaseName(st.cycle)) + '">' +
        moonSVG(st.cycle, 30) + '<span>' + d + '</span>' + (marks[d] ? '<b>' + LABEL[marks[d].type].split(' ')[0] + '</b>' : '') + '</div>';
    }
    $('grid').innerHTML = html;
  }

  var input = $('date'), today = startOfDay(new Date());
  function current() {
    var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(input.value);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : today;
  }
  input.value = toInput(today);
  input.addEventListener('change', function () { render(current()); });
  function step(days) { var d = current(); d.setDate(d.getDate() + days); input.value = toInput(d); render(d); }
  $('prev').addEventListener('click', function () { step(-1); });
  $('nextday').addEventListener('click', function () { step(1); });
  $('today').addEventListener('click', function () { input.value = toInput(today); render(today); });
  render(today);
})();
