Array.prototype.shuffle = function () {
    return this.sort(function () {
        return 0.5 - Math.random();
    });
};

function getTransactionsArr() {
    return db.getCollection('Transaction').find({});
};

function uniqueVal(value, index, self) {
    return self.indexOf(value) === index;
};

function getDates() {
    return arr = db.getCollection('rates').find({});
};

function generateAmount(min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
};

function getYears() {
    var dates = [];
    var yearsArray = [];
    dates = getDates();
    for (var i = 0; i < dates.length() - 1; i++) {
        yearsArray[i] = dates[i].date.split('.')[2];
    };
    return yearsArray.filter(uniqueVal);
};

function IsLeapYear(year) {
    if (year % 4 == 0) {
        if (year % 100 == 0) {
            if (year % 400 == 0) {
                return true;
            }
            else
                return false;
        }
        else
            return true;
    }
    return false;
};

function parseData(obj) {
    var paramObj = {};
    paramObj.type = obj['Type'];
    paramObj.operationName = obj['Operation Name'];
    paramObj.amountMin = obj['AmountMin'];
    paramObj.amountMax = obj['AmountMax'];
    paramObj.currency = obj['Currency'];
    paramObj.rate = obj['Rate'];
    paramObj.period = obj['Period'];
    paramObj.account = obj['Account'];
    return paramObj;
};

function findDenominationElement() {
    var arr = getRatesDate();
    var denomination = new Date(2016, 6, 1);
    var denomElement;
    for (var i = 0; i < arr.length - 1; i++) {
        if (arr[i]['date'] >= denomination) {
            denomElement = i;
            break;
        };
    };
    return denomElement;
};

function stepMonth(param, year) {
    var value;
    var i = parseInt(param)
    switch (i) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            value = 31;
            break;

        case 4:
        case 6:
        case 9:
        case 11:
            value = 30;
            break;

        default:
            if (IsLeapYear(year)) {
                value = 29;
            } else {
                value = 28;
            }
    };
    return value;
};

function run() {
    var transactionArray = getTransactionsArr();
    for (var transaction = 0; transaction <= transactionArray.length() -1; transaction++) {
        var obj = parseData(transactionArray[transaction]);
        switch (obj.period) {
            case 'Year':
                year(obj);
            break;

            case 'Month':
                month(obj);
            break;

            case 'Week':
                week(obj);
            break;
        };
    };
};

function getYearsDate(param){
	var i = parseInt(param);
    if (IsLeapYear(i)){
        return 366;
    } else {
        return 365;
    }
};

function getArrayBeforeDenomination(){
    var denominationDate = findDenominationElement();
    var datesRate = getRatesDate();
    var arr = datesRate.splice(0, denominationDate);
    return arr;
};

function getArrayAfterDenom(){
    var denominationDate = findDenominationElement();
    var datesRate = getRatesDate();
    var arr = datesRate.splice(denominationDate, datesRate.length);
    return arr;
};

function compareNumeric(a, b) {
    if (a.date > b.date) return 1;
    if (a.date < b.date) return -1;
};

function getRatesDate() {
    var newItem = [];
    var sortArray = [];
    db.getCollection('rates').find({}).forEach(function (doc) {
        var obj = {
            '_id': doc['_id'],
            'date': new Date(doc['date'].split('.')[2], doc['date'].split('.')[0] - 1, doc['date'].split('.')[1]),//[2] [1]-1 [0]
            'rate': doc['rate'],
			'dateString' : doc['date'].split('.')[1] + '_' + doc['date'].split('.')[0] + '_' + doc['date'].split('.')[2]//[0] [1]
        };
        newItem.push(obj);
    });
    return newItem.sort(compareNumeric);
};

var controlDenomination = {
    flag : true
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function week(obj) {
    var arrBeforeDenomination = getArrayBeforeDenomination();
	var arrAfterDenomination = getArrayAfterDenom();
    var denominationDate = findDenominationElement();
    var datesRate = getRatesDate();
    var countLength = datesRate.length;
	var arrLen = arrAfterDenomination.length;
    var datesForRand = [];
    var datesForUPD = [];
    if (obj.currency === 'Byr') {
        for (var i = 0; i < denominationDate-1; i = i + 7) {
            datesForRand = datesRate.splice(0, 7);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        }
    } else if (obj.currency === 'Byn') {
        for (var i = 0; i < arrLen - 1; i = i + 7) {
            datesForRand = arrAfterDenomination.splice(0, 7);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                if (controlDenomination.flag){
                    controlDenomination.flag = false;
                    elem = 0;
                }
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        }
    } else {
        print('!!!!');
    };
};

function month(obj) {
    var arrBeforeDenomination = getArrayBeforeDenomination();
    var arrAfterDenomination = getArrayAfterDenom();
    var arrLen = arrAfterDenomination.length;
    var denominationDate = findDenominationElement();
    var datesRate = getRatesDate();
    var countLength = datesRate.length;
    var datesForRand = [];
    var datesForUPD = [];
    var countDay = 0;
    if (obj.currency === 'Byr'){
        for (var i = 0; i < denominationDate-1; i = i + countDay) {
            countDay = stepMonth(arrBeforeDenomination[0]['dateString'].split('_')[1], arrBeforeDenomination[0]['dateString'].split('_')[2]);
            datesForRand = arrBeforeDenomination.splice(0, countDay);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        }
    } else if (obj.currency === 'Byn') {
        for (var i = 0; i < arrLen-1; i = i + countDay) {
            countDay = stepMonth(arrAfterDenomination[0]['dateString'].split('_')[1], arrAfterDenomination[0]['dateString'].split('_')[2]);
            datesForRand = arrAfterDenomination.splice(0, countDay);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        }
    } else {
        for (var i = 0; i < countLength-1; i = i + countDay){
            countDay = stepMonth(datesRate[0]['dateString'].split('_')[1], datesRate[0]['dateString'].split('_')[2]);
            datesForRand = datesRate.splice(0, countDay);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        };
    };
};

function year(obj){
    var arrAfterDenomination = getArrayAfterDenom();
    var arrLen = arrAfterDenomination.length; 
    var denominationDate = findDenominationElement();
    var datesRate = getRatesDate();
    var countLength = datesRate.length; 
    var arrBeforeDenomination = getArrayBeforeDenomination();
    var datesForRand = [];
    var datesForUPD = [];
    var countDay = 0;
    if (obj.currency === 'Byr'){
        for (var i = 0; i <= denominationDate; i = i + countDay){
            countDay = getYearsDate(arrBeforeDenomination[0]['dateString'].split('_')[2]);//
            datesForRand = arrBeforeDenomination.splice(0, countDay);//
			var end = datesForRand[datesForRand.length-1];
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        }
    } else if (obj.currency === 'Byn'){
        for (var i = 0; i <= arrLen; i = i + countDay){
            countDay = getYearsDate(arrAfterDenomination[0]['dateString'].split('_')[2]);
            datesForRand = arrAfterDenomination.splice(0, countDay);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        }
    } else {
        for (var i = 0; i <= countLength; i = i + countDay){
            countDay = getYearsDate(datesRate[0]['dateString'].split('_')[2]);
            datesForRand = datesRate.splice(0, countDay);
            for (var countRate = obj.rate; countRate > 0; countRate--) {
                var elem = getRandomInt(0, datesForRand.length - 1);
                var xxx = datesForRand.splice(elem, 1);
                var trObj = {
                    'date': xxx[0]['date']
                };
                datesForUPD.push(trObj);
            };
			updateDB(datesForUPD, obj);
            datesForUPD = [];
        };
    };
};

function updateDB(arr, obj){
	for (var i = 0; i < arr.length; i++){
		db.getCollection('Result').insert({
				'Type' : obj.type,
				'ISODate' : arr[i]['date'],
				'Period' : obj.period,
				'Rate' : obj['rate'],
				'Category name' : obj.operationName,
				'CategoryID' : updCategoryColl(obj),
				'Amount' : generateAmount(obj.amountMin, obj.amountMax), 
				'Account': obj.account + '_' + obj.currency,
				'AccountID' : updAccountColl(obj),
				'Currency': obj.currency,
				'Transaction Name': generateTitle(obj)
		});
	};
};

function generateTitle(obj) {
    var operationNames = {
    'House Rent': ['House Rent 1', 'House Rent2', 'House Rent3', 'House Rent4'],
    'Parents': ['Parents 1', 'Parents 2', 'Parents 3', 'Parents 4'],
    'Grocery Shopping': ['Grocery Shopping 1', 'Grocery Shopping 2', 'Grocery Shopping 3', 'Grocery Shopping 4'],
    'Clothes Shopping': ['Clothes Shopping 1', 'Clothes Shopping 2', 'Clothes Shopping 3', 'Clothes Shopping 4'],
    'Transport': ['Transport 1', 'Transport 2', 'Transport 3', 'Transport 4'],
    'Rest': ['Rest 1', 'Rest 2', 'Rest 3', 'Rest 4'],
    'Study': ['Study 1', 'Study 2', 'Study 3', 'Study 4'],
    'Utilities': ['Utilities 1', 'Utilities 2', 'Utilities 3', 'Utilities 4'],
    'Internet': ['Internet 1', 'Internet 2', 'Internet 3', 'Internet 4'],
    'Phone': ['Phone 1', 'Phone 2', 'Phone 3', 'Phone 4'],
    'Phone, Internet': ['Phone, Internet 1 ', 'Phone, Internet 2', 'Phone, Internet 3', 'Phone, Internet 4'],
    'Utilities, Phone': ['Utilities, Phone 1', 'Utilities, Phone 2', 'Utilities, Phone 3', 'Utilities, Phone 4'],
    'Salary': ['Salary 1', 'Salary 2', 'Salary 3', 'Salary 4']
  }
  return operationNames[obj.operationName].shuffle()[0];
};

function updAccountColl(obj) {
    var a = db.getCollection('Accounts').findOne({ 'Account': obj.account + '_' + obj.currency });
    if (a === null){
        return db.getCollection('Accounts').insertOne({ 'Account': obj.account + '_' + obj.currency, 'Currency': obj.currency }).insertedId;
    } else {
        return a['_id'];
    }
};

function updCategoryColl(obj) {
    var a = db.getCollection('Categories').findOne({ 'Category name': obj.operationName });
    if ( a === null){
        return db.getCollection('Categories').insertOne({ 'Category name': obj.operationName }).insertedId;
    } else {
        return a['_id'];
    }
};

run();