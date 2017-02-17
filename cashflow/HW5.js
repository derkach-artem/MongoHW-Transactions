db.Result.aggregate([
    { $match: { "FriendID": { $exists: true } } },
    { $group: { _id: { friend: "$FriendID", currency: "$Currency" }, Amount: { $sum: "$Amount" } } },
    { $project: { _id: "$_id.friend", currency: "$_id.currency", amount: "$Amount" } },
    { $group: { _id: "$_id", debts: { $push: { currency: "$currency", total: "$amount" } } } },
    { $lookup: { from: "Friends", localField: "_id", foreignField: "_id", as: "_id" } },
    { $project: { "_id": "$_id.Name", "debts": 1 } }
]);