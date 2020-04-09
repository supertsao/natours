const fs = require('fs')
const express = require('express')
const morgan = require('morgan')

const app = express()

// req.body 能讀取JSON 資料 是因為 express.json() middleware 幫我們讀資料和轉換成 JSON Object
// middleware
app.use(express.json())
app.use(morgan('dev'))

app.use((req, res, next) => {
  console.log('Hello from the middleware')
  next()
})

app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleString()
  next()
})

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8')
)

// Route Handlers
const getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestAt: req.requestTime,
    result: tours.length,
    data: {
      tours: tours
    }
  })
}
const getTour = (req, res) => {
  const id = req.params.id * 1
  const findTour = tours.find(el => el.id === id)
  if (id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    })
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: findTour
    }
  })
}
const createTour = (req, res) => {
  // const newId=tours[tours.length-1].id+1
  const newId = tours.length
  const newTour = Object.assign({ id: newId }, req.body)
  console.log(req.body)
  tours.push(newTour)
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    err => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour
        }
      })
    }
  )
}
const updateTours = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    })
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Update tour here>'
    }
  })
}
const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    })
  }

  res.status(204).json({
    status: 'success',
    data: null
  })
}

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/users.json`, 'utf-8')
)

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This Route is not yet defined'
  })
}
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This Route is not yet defined'
  })
}
const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This Route is not yet defined'
  })
}
const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This Route is not yet defined'
  })
}
const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This Route is not yet defined'
  })
}

const tourRouter = express.Router()
const userRouter = express.Router()
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

// ROUTE
tourRouter
  .route('/')
  .get(getAllTours)
  .post(createTour)
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(updateTours)
  .delete(deleteTour)

userRouter
  .route('/')
  .get(getAllUsers)
  .post(createUser)
userRouter
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

const port = 8080
app.listen(port, 'localhost', () => {
  console.log(`App running on port ${port}...`)
})
