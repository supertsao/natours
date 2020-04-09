const Tour = require('../models/tourModel')

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingAverage,summary,difficulty'
  next()
}

exports.getAllTours = async (req, res) => {
  try {
    // console.log(req.query)
    // ...表示取出req.query裡面的元素 {}附值到一個新的obj
    // 1A).filtering
    const queryObj = { ...req.query }
    const excludedField = ['page', 'sort', 'limit', 'fields']
    excludedField.forEach(el => delete queryObj[el])
    // 1B).advance filtering
    // {difficulty:'easy',duration: {$gte:5}}
    // {difficulty:'easy',duration: { gte:'5' }}
    // replace gte gt lte lt
    let queryString = JSON.stringify(queryObj)
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    )
    let query = Tour.find(JSON.parse(queryString))

    // 2.sorting
    if (req.query.sort) {
      // price,ratingsQuantity=>price ratingsQuantity
      let sortBy = req.query.sort.split(',').join(' ')
      query = query.sort(sortBy)
    } else {
      query = query.sort('-createdAt')
    }
    // 3.field limit
    if (req.query.fields) {
      query = query.select(req.query.fields.split(',').join(' '))
    } else {
      query = query.select('-__v')
    }
    // 4.pagination
    // skip多少document ignore10旅行團 也就是從第2頁開始
    const page = req.query.page * 1 || 1
    const limit = req.query.limit * 1 || 100
    const skip = (page - 1) * limit
    query = query.skip(skip).limit(limit)
    if (req.query.page) {
      const numTours = await Tour.countDocuments()
      if (skip >= numTours) throw new Error('This page does not exit')
    }
    // 4.execute query
    const tours = await query
    // query.sort().select().skip().limit()

    res.status(200).json({
      status: 'success',
      requestAt: req.requestTime,
      result: tours.length,
      data: {
        tours
      }
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
}
exports.getTour = async (req, res) => {
  try {
    // 效果等於Tour.findOne({_id:req.params.id})
    const tour = await Tour.findById(req.params.id)
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    })
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    })
  }
}
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body)
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    })
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: err
    })
  }
}

exports.updateTours = async (req, res) => {
  try {
    tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      // return的才會是更新好的document
      new: true,
      runValidators: true
    })
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    })
  } catch (err) {
    res.status(400).json({
      status: 'failure',
      message: err
    })
  }
}
exports.deleteTour = async (req, res) => {
  const tour = await Tour.findById(req.params.id)
  await Tour.findByIdAndDelete(req.params.id)
  try {
    res.status(200).json({
      status: 'Successful Deleted',
      data: {
        tour
      }
    })
  } catch {
    res.status(400).json({
      status: 'failure',
      message: err
    })
  }
}
