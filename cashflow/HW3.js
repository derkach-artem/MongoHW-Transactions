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
    denominationFlag : true
}

function operation(obj) {
    if (obj.Type === 'Exp') {
        money[obj.Account] = money[obj.Account] - obj['Amount'];
        money.Byr = (money.Purse_Byr) + (money.Card_Byr);
        money.Byn = (money.Purse_Byn) + (money.Card_Byn); 
    } else {
        money[obj.Account] = money[obj.Account] + obj['Amount'];
        money.Byr = (money.Purse_Byr) + (money.Card_Byr);
        money.Byn = (money.Purse_Byn) + (money.Card_Byn);
    }
};

function getRatesDate() {
    var newItem = [];
    var sortArray = [];
    db.getCollection('rates').find({}).forEach(function (doc) {
        var obj = {
            '_id': doc['_id'],
            'date': new Date(doc['date'].split('.')[2], doc['date'].split('.')[0] - 1, doc['date'].split('.')[1]),
            'rate': doc['rate'],
            'dateString': doc['date'].split('.')[1] + '_' + doc['date'].split('.')[0] + '_' + doc['date'].split('.')[2]
        };
        newItem.push(obj);
    });
    return newItem.sort(compareNumeric);
};

function getFlowDates() {
    var denommination = new Date(2016, 6, 1);
    var arr = getRatesDate();
    var count = db.getCollection('rates').find({}).count();
    for (var i = 0; i < count; i++) {
        var etalonDate = arr[i].date;
        var rate = arr[i].rate;
        var a = db.getCollection('Result').find({ 'ISODate': etalonDate }).toArray();
        if (a.length > 0) {
            for (var j = 0; j < a.length; j++) {
                operation(a[j]);
            }
            checkSumm(rate, i, denommination, a);
        } else {

        }
    }
}

function checkSumm(rate, i, denommination, a) {
    if (a[0]["ISODate"] < denommination) {
        if (money.Byr < 0 && money.Safe_Usd > 0) {
            usdToByr(rate, a)
        } else if (money.Byr > 0 && money.Safe_Usd < 0) {
            byrToUsd(rate, a)
        } else {
            return;
        }
    } else {
        if (money.denominationFlag) {
            transfer(a)
        }
        if (money.Byn < 0 && money.Safe_Usd > 0) {
            usdToByn(rate, a)
        } else if (money.Byn > 0 && money.Safe_Usd < 0) {
            bynToUsd(rate, a)
        } else {
            return;
        }
        return;
    }
};

function usdToByr(rate, a) {
    var incByr = 0;
    var needUsd = 0;
    var debitByr = money.Byr;
    debitByr = debitByr * -1;
    needUsd = Math.ceil(debitByr / rate);
    if (money.Safe_Usd >= needUsd) {
        money.Safe_Usd = money.Safe_Usd - needUsd;
        incByr = needUsd * rate;
        money.Byr = money.Byr + incByr;
        money.Purse_Byr += incByr;
    } else {
        needUsd = money.Safe_Usd;
        money.Safe_Usd = money.Safe_Usd - needUsd;
        incByr = needUsd * rate;
        money.Byr = money.Byr + incByr;
        money.Purse_Byr += incByr;
    };

    db.getCollection('Result').insert({
        "Type": "Exp",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeUsdToByr",
        "Amount": needUsd,
        "Currency": "Usd",
        "AccountID": getAccountUsd(),
        "Account": "Safe_Usd"
    });

    db.getCollection('Result').insert({
        "Type": "Inc",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeUsdToByr",
        "Amount": incByr,
        "Currency": "Byr",
        "AccountID": getAccountPurseByr(),
        "Account": "Purse_Byr"
    });
};

function byrToUsd(rate, a) {
    var incUsd = 0;
    var needByr = 0;
    var expByr = 0;
    var debitUsd = money.Safe_Usd;
    debitUsd = debitUsd * -1;
    needByr = debitUsd * rate;
    if (money.Byr >= needByr) {
        expByr = needByr;
        money.Byr = money.Byr - needByr;
        money.Purse_Byr -= needByr;
        incUsd = needByr / rate;
        money.Safe_Usd = money.Safe_Usd + incUsd;
    } else {
        if (money.Byr >= rate) {
            needByr = money.Byr;
            incUsd = Math.floor(needByr / rate);
            expByr = incUsd * rate;
            money.Byr = money.Byr - expByr;
            money.Purse_Byr -= expByr;
            money.Safe_Usd = money.Safe_Usd + incUsd;
        } else {
            return;
        }
    };

    db.getCollection('Result').insert({
        "Type": "Exp",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeByrToUsd",
        "Amount": expByr,
        "Currency": "Byr",
        "AccountID": getAccountPurseByr(),
        "Account": "Purse_Byr"
    });

    db.getCollection('Result').insert({
        "Type": "Inc",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeByrToUsd",
        "Amount": incUsd,
        "Currency": "Usd",
        AccountID: getAccountUsd(),
        "Account": "Safe_Usd"
    });
};

function usdToByn(rate, a) {
    var incByn = 0;
    var needUsd = 0;
    var debitByn = money.Byn;
    debitByn = debitByn * -1;
    print(debitByn);
    var rate = rate.replace(/,/, '.');
    Number(rate);
    needUsd = Math.ceil(debitByn / rate);
    if (money.Safe_Usd >= needUsd) {
        money.Safe_Usd = money.Safe_Usd - needUsd;
        incByn = needUsd * rate;
        money.Byn = money.Byn + incByn;
        money.Purse_Byn += incByn;
    } else {
        needUsd = money.Safe_Usd;
        print(needUsd);
        print(money.Safe_Usd);
        money.Safe_Usd = money.Safe_Usd - needUsd;
        incByn = needUsd * rate;
        money.Byn = money.Byn + incByn;
        money.Purse_Byn += incByn;
    };

    db.getCollection('Result').insert({
        "Type": "Exp",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeUsdToByn",
        "Amount": needUsd,
        "Currency": "Usd",
        "AccountID": getAccountUsd(),
        "Account": "Safe_Usd"
    });

    db.getCollection('Result').insert({
        "Type": "Inc",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeUsdToByn",
        "Amount" : Math.ceil((incByn)*100)/100,
        "Currency": "Byn",
        "AccountID": getAccountPurseByn(),
        "Account": "Purse_Byn"
    });

};

function bynToUsd(rate, a) {
    var incUsd = 0;
    var needByn = 0;
    var expByn = 0;
    var rate = rate.replace(/,/, '.');
    Number(rate);
    var debitUsd = money.Safe_Usd;
    debitUsd = debitUsd * -1;
    needByn = debitUsd * rate;
    if (money.Byn >= needByn) {
        expByn = needByn;
        money.Byn = money.Byn - needByn;
        money.Purse_Byn -= needByn;
        incUsd = needByn / rate;
        money.Safe_Usd = money.Safe_Usd + incUsd;
    } else {
        if (money.Byn >= rate) {
            needByn = money.Byn;
            incUsd = Math.floor(needByn / rate);
            expByn = incUsd * rate;
            money.Byn = money.Byn - expByn;
            money.Purse_Byn -= expByn;
            money.Safe_Usd = money.Safe_Usd + incUsd;
        } else {
            return;
        }
    };

    db.getCollection('Result').insert({
        "Type": "Exp",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeBynToUsd",
        "Amount" : Math.ceil((expByn)*100)/100,
        "Currency": "Byn",
        "AccountID": getAccountCardByn(),
        "Account": "Purse_Byn"
    });

    db.getCollection('Result').insert({
        "Type": "Inc",
        "ISODate": a[0]["ISODate"],
        "Category name": "ExchangeBynToUsd",
        "Amount": incUsd,
        "Currency": "Usd",
        AccountID: getAccountUsd(),
        "Account": "Safe_Usd"
    });
};

function getAccountPurseByr() {
    var a = db.getCollection('Accounts').findOne({ "Account": "Purse_Byr" });
    return a['_id'];
};

function getAccountCardByr() {
    var a = db.getCollection('Accounts').findOne({ "Account": "Card_Byr" });
    return a['_id'];
};

function getAccountUsd() {
    var a = db.getCollection('Accounts').findOne({ "Account": "Safe_Usd" });
    return a['_id'];
};

function getAccountCardByn() {
    var a = db.getCollection('Accounts').findOne({ "Account": "Card_Byn" });
    return a['_id'];
};

function getAccountPurseByn() {
    var a = db.getCollection('Accounts').findOne({ "Account": "Purse_Byn" });
    return a['_id'];
};

function transfer(a) {

    money.denominationFlag = false;
    var transferPurseByr = money.Purse_Byr / 10000;
    var transferCardByr = money.Card_Byr / 10000;
    money.Purse_Byn = money.Purse_Byn + transferPurseByr;
    money.Card_Byn = money.Card_Byn + transferCardByr;

    db.getCollection('Result').insert({
        "Type": "Exp",
        "ISODate": a[0]["ISODate"],
        "Category name": "Transfer",
        "Amount": money.Purse_Byr,
        "Currency": "Byr",
        "AccountID": getAccountPurseByr(),
        "Account": 'Purse_Byr'
    });

    db.getCollection('Result').insert({
        "Type": "Exp",
        "ISODate": a[0]["ISODate"],
        "Category name": "Transfer",
        "Amount": money.Card_Byr,
        "Currency": "Byr",
        "AccountID": getAccountCardByr(),
        "Account": 'Card_Byr'
    });

    db.getCollection('Result').insert({
        "Type": "Inc",
        "ISODate": a[0]["ISODate"],
        "Category name": "Transfer",
        "Amount" : Math.ceil((transferPurseByr)*100)/100,
        "Currency": "Byn",
        "AccountID": getAccountPurseByn(),  
        "Account": 'Purse_Byn'
    });

    db.getCollection('Result').insert({
        "Type": "Inc",
        "ISODate": a[0]["ISODate"],
        "Category name": "Transfer",
        "Amount" : Math.ceil((transferCardByr)*100)/100,
        "Currency": "Byn",
        "AccountID": getAccountCardByn(),
        "Account": 'Card_Byn'
    });

    money.Purse_Byr = 0;
    money.Card_Byr = 0;
    money.Byr = 0;
}

getFlowDates();