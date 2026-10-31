var { Invoices, Requests, Polls } = require('../db/models');


/**
 * toPeriod -- сар, өдөр, цагийг YYYY-MM-DD хэлбэрт хөрвүүлнэ
 * collectionStats -- "Цугларсан / нэхэмжилсэн", "Төлөлтийн хувь" картын өгөгдөл
 * monthStart -- MonthlyChart ийг хийхэд хэрэглэх хүснэгт
 */

function toPeriod(date) {
  var month = String(date.getMonth() + 1).padStart(2, '0'); 
  return date.getFullYear() + '-' + month + '-01';
}

function monthStart(monthsAgo) {
  var d = new Date();
  d.setDate(1); 
  d.setMonth(d.getMonth() - monthsAgo);
  return toPeriod(d);
}

async function collectionStats(period) {
  var rows = await Invoices.monthlySummary(period);

  var current = rows[0] || { billed: 0, collected: 0, units: 0, paid_units: 0 };

  return {
    billed: current.billed,       
    collected: current.collected,   
    units: current.units,          
    paid_units: current.paid_units, 
    percent: current.billed ? Math.round((current.collected / current.billed) * 100) : 0,
  };
}

async function overdueStats() {
  var overdue = await Invoices.overdueTotal();

  return {
    debt: overdue.debt,  
    units: overdue.units, 
  };
}

async function requestStats() {
  var [open, avgHours] = await Promise.all([
    Requests.openCount(),                 
    Requests.avgResolveHours(monthStart(2)), 
  ]);

  return {
    open: open,
    avg_hours: avgHours, 
  };
}

async function monthlyChart(req, res, next) {
  try {
    var rows = await Invoices.monthlySummary(monthStart(11));

    var months = [];
    for (var m = 11; m >= 0; m--) {
      var period = monthStart(m); 
      var row = rows.find(function (r) { return r.period === period; });

      months.push({
        period: period,
        billed: row ? row.billed : 0,      
        collected: row ? row.collected : 0, 
      });
    }

    res.json(months);
  } catch (err) {
    next(err);
  }
}

async function topDebtors(req, res, next) {
  try {
    var limit = Number(req.query.limit) || 6; 
    res.json(await Invoices.debtors(limit));
  } catch (err) {
    next(err);
  }
}

async function requestCategories(req, res, next) {
  try {
    res.json(await Requests.countByCategory(toPeriod(new Date())));
  } catch (err) {
    next(err);
  }
}


async function show(req, res, next) {
  try {
    var period = toPeriod(new Date());

    var [collection, overdue, requests] = await Promise.all([
      collectionStats(period),
      overdueStats(),
      requestStats(),
    ]);

    res.json({
      period: period,
      collection: collection,
      overdue: overdue,
      requests: requests,
    });
  } catch (err) {
    next(err);  
  }
}

module.exports = { show, monthlyChart, topDebtors, requestCategories };
