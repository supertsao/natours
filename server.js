const mongoose = require('mongoose')
const dotenv = require('dotenv')

process.on('uncaughtException', err => {
  console.log('Uncaught Exception! Shutting Down...')
  console.log(err.name, err.message)
  process.exit(1)
})

dotenv.config({ path: './config.env' })
const app = require('./app')

const db = process.env.DATABASE.replace(
  /<PASSWORD>/,
  process.env.DATABASE_PASSWORD
)
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

//連接local database
// mongoose
//   .connect(process.env.DATABASE_LOCAL, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true
//   })
//   .then(con => {
//     console.log('LocalDB connection established')
//   })

// console.log(app.get('env'))
// console.log(process.env)
const port = process.env.port
const server = app.listen(port, 'localhost', () => {
  console.log(`本地SERVER開啟 監聽PORT: ${port}...`)
})

process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection! Shutting Down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})
