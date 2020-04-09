const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync.js')
const factory = require('./handlerFactory.js')
const AppError = require('../utils/appError.js')
const multer = require('multer')
const sharp = require('sharp')

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image,Please upload only image', 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
])

// upload.single('photo')
// upload.fields('photo')

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(JSON.parse(JSON.stringify(req)))
  // console.log(req.files)

  if (!req.files.imageCover || !req.files.images) return next()

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`)

  req.body.images = []
  console.log(req.body)

  // req.files.images.forEach(async (image, index) => {
  //   const imageName = `tour-${req.params.id}-${Date.now()}-${index}.jpeg`
  //   // 儲存檔案
  //   await sharp(image.buffer)
  //     .resize(500, 500)
  //     .toFormat('jpeg')
  //     .jpeg({ quality: 90 })
  //     .toFile(`public/img/tours/${imageName}`)
  //   // 把儲存檔案的檔名存到資料庫
  //   req.body.images.push(imageName)
  // })

  // 因為要loop3個檔案用async 會有問題 所以先用map儲存這3個promise 在await Promise.all
  await Promise.all(
    req.files.images.map(async (image, index) => {
      const imageName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`
      // 儲存檔案
      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageName}`)
      // 把儲存檔案的檔名存到資料庫
      req.body.images.push(imageName)
    })
  )
  // console.log(req.body)
  next()
})

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingAverage,summary,difficulty'
  next()
}

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
exports.createTour = factory.createOne(Tour)
exports.updateTours = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        旅行團總數: { $sum: 1 },
        總共多少評價: { $sum: '$ratingsQuantity' },
        平均評價: { $avg: '$ratingsAverage' },
        平均價格: { $avg: '$price' },
        最低價: { $min: '$price' },
        最高價: { $max: '$price' }
      }
    },
    {
      $sort: { 平均價格: 1 }
    }
  ])
  res.status(200).json({
    status: 'Success',
    data: {
      stats
    }
  })
})
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        出團數: { $sum: 1 },
        旅行團: { $push: { 團名: '$name', 價格: '$price' } },
        總價格: { $sum: '$price' }
      }
    },
    {
      $addFields: { 月份: '$_id' }
    },
    {
      $project: { _id: 0 }
    },
    {
      // $sort: { 出團數: -1 }
      $sort: { 月份: 1 }
    },
    {
      $limit: 20
    }
  ])
  res.status(200).json({
    status: 'Success',
    data: {
      plan
    }
  })
})
// 'tours-within/:distance/center/:latlng/unit/:unit'
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude'), 400)
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  })

  res.status(200).json({
    status: 'Success',
    result: tours.length,
    data: {
      data: tours
    }
  })
})

// /tours/distance/34.111745,-118.113491/unit/mi
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params
  const [lat, lng] = latlng.split(',')

  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude'), 400)
  }

  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'Success',
    data: {
      data: distance
    }
  })
})
