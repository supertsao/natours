const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('../../models/tourModel')
const User = require('../../models/userModel')
const Review = require('../../models/reviewModel')

dotenv.config({ path: '../../config.env' })

// console.log(process.env.DATABASE)
const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
// 連接雲端database
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    console.log('雲端資料庫連接完成...')
  })

const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'))
const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'))
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'))

const importData = async () => {
  try {
    await Tour.create(tours)
    await User.create(users, { validateBeforeSave: false })
    await Review.create(reviews)
    console.log('Json成功轉入資料庫')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

const deleteData = async () => {
  try {
    await Tour.deleteMany()
    await User.deleteMany()
    await Review.deleteMany()
    console.log('資料庫資料成功清除')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData()
}
// console.log(process.argv)
