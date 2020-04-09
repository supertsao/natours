db.tours.insertOne({name:'Hello insert',price:199,rating:5.0})
db.tours.find()

db.tours.find({$or:[{price:{$gt:400}},{rating:{$gte:4.8}}]})
db.tours.find({price:{$gt:500},rating:{$gte:4.8}})

db.tours.updateOne({name:"你好"},{$set:{name:"你好嗎?"}})
db.tours.updateMany({price:{$gt:500},rating:{$gte:4.8}},{$set:{newfield:'多一個欄位'}})

db.tours.deleteMany({rating:{$gte:5}})
// 清除所有數據
db.tours.deleteMany({})