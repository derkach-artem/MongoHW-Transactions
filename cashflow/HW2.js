function compareNumeric(a, b) {
    if (a.date > b.date) return 1;
    if (a.date < b.date) return -1;
};

function getResultDates() {
    return db.getCollection('Result').find({});
};

var money = {
    Purse_Byr: 0,
    Card_Byr: 0,
    Byr: 0,
    Purse_Byn: 0,
    Card_Byn: 0,
    Byn: 0,
    Safe_Usd: 0,
}

function operation(obj) {
    if (obj.Type === 'Exp') {
        money[obj.Account] = money[obj.Account] - obj['Amount'];
        money.Byr = ((money.Purse_Byr) + (money.Card_Byr));
        money.Byn = ((money.Purse_Byn) + (money.Card_Byn));
    } else {
        money[obj.Account] = money[obj.Account] + obj['Amount'];
        money.Byr = ((money.Purse_Byr) + (money.Card_Byr));
        money.Byn = ((money.Purse_Byn) + (money.Card_Byn));
    }
};


function checkCurrency(obj) {
    return obj.Currency.toString();
}

function getRatesDate() {
    var newItem = [];
    var sortArray = [];
    db.getCollection('rates').find({}).forEach(function (doc) {
        var obj = {
            '_id': doc['_id'],
            'date': new Date(doc['date'].split('.')[2], doc['date'].split('.')[0] - 1, doc['date'].split('.')[1]),//[2] [1]-1 [0]
            'rate': doc['rate'],
            'dateString': doc['date'].split('.')[1] + '_' + doc['date'].split('.')[0] + '_' + doc['date'].split('.')[2]
        };
        newItem.push(obj);
    });
    return newItem.sort(compareNumeric);
};

function getFlowDates() {
    db.getCollection('CashFlow').remove({});
    var arr = getRatesDate();
    var denommination = new Date(2016, 6, 1);
    var count = db.getCollection('rates').find({}).count();
    var Byn;
    for (var i = 0; i < count; i++) {
        var etalonDate = arr[i].date;
        var a = db.getCollection('Result').find({ 'ISODate': etalonDate }).toArray();
        if (a.length > 0) {
            for (var j = 0; j < a.length; j++) {
                operation(a[j]);
            }
            db.getCollection('CashFlow').insert({
                "ISODate": a[0]["ISODate"],
                'flow': true,
                "Byr": money.Purse_Byr + money.Card_Byr,
                "Byn" : money.Purse_Byn + money.Card_Byn,
                "Usd": money.Safe_Usd
            })
        } else {
            Byn = money.Purse_Byn + money.Card_Byn;
            db.getCollection('CashFlow').insert({
                "ISODate": arr[i]["date"],
                'flow': false,
                "Byr": money.Purse_Byr + money.Card_Byr,
                "Byn" : money.Purse_Byn + money.Card_Byn,
                "Usd": money.Safe_Usd
            })
        }
    }
}

getFlowDates();