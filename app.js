const path = require('path')
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require('./utils/appError.js')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require('./routes/tourRoutes.js')
const userRouter = require('./routes/userRoutes.js')
const reviewRouter = require('./routes/reviewRoutes.js')
const bookingRouter = require('./routes/bookingRoutes.js')
const viewRouter = require('./routes/viewRoutes.js')
// start express app
const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
// app.use(express.static(`${__dirname}/public`))
app.use(express.static(path.join(__dirname, 'public')))

// Global middleware 設定安全的http headers
app.use(helmet())

// 日誌
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many request from this IP,Please try again in an hour'
})
// limit request from same api
app.use('/api', limiter)

// req.body 能讀取JSON 資料 是因為 express.json() middleware 幫我們讀資料和轉換成 JSON Object
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// 清洗資料防止NOSQL injection
app.use(mongoSanitize())

// 清洗資料防止xss攻擊 html javascript代碼清洗
app.use(xss())

// 避免parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
)

// 測試用
app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleString()
  // console.log(req.cookies)
  next()
})

app.use('/', viewRouter)
// mounting the router
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/booking', bookingRouter)
// all指全部GET,POST...方法

// 前面路徑都不行才會跑這個 順序不能錯
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`)
  // err.status = 'fail'
  // err.statusCode = 404
  // next(err)

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})
// Error-handling middleware
app.use(globalErrorHandler)
// app.use((err, req, res, next) => {
//   // console.log(err.stack)
//   err.statusCode = err.statusCode || 500
//   err.status = err.status || 'error'

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   })
//   next()
// })

module.exports = app
