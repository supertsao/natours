const mongoose = require('mongoose')
const slugify = require('slugify')
// const User = require('./userModel.js')

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have less then or equal than 40 characters'],
      minlength: [5, 'Tour name must have more or equal than 10 characters']
      // validate:[validator.isAlpha,'tour name must only contain alphanumeric characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either "easy" ,"medium", "difficult"'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must above 1.0'],
      max: [5, 'Rating must below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // 只有創建document時有效 updat沒效
          return val < this.price
        },
        message: 'PriceDiscount({VALUE}) should lower than price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a cover image']
    },
    secretTour: {
      type: Boolean,
      default: false
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // 記錄多個景點用[] 上面是出發點 先列出來
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere' })

tourSchema.virtual('durationWeek').get(function() {
  return this.duration / 7
})
// tour並沒有review的紀錄 只有review有tour的紀錄 也就是parent referencing 故tour用virtual方式把review叫出來
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})

// document middleware berfore .save() and .create()
// this指的是儲存到資料庫之前的document
tourSchema.pre('save', function(next) {
  // 把"the forest hiker" 變成 "the-forest-hiker"
  this.slug = slugify(this.name, { lower: true })
  next()
})

// 把user寫死在Tour裡面(embedded)在這不好用 因為之後改user role還要再改這裡的資料 故此範例只是演示 這次不用
// tourSchema.pre('save', async function(next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromise)
// })
// 儲存到資料庫後的document 不用在用this因為已經儲存了 但callback有個doc可以叫出來
// tourSchema.post('save', function(doc, next) {
//   console.log(doc)
//   next()
// })

// Query middleware 對findByID findByIDandUpdate...沒用 故用正則全部找出不要用
// tourSchema.pre(/find/, function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } })
  this.start = Date.now()
  next()
})

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeAt'
  })
  next()
})

tourSchema.post(/^find/, function(doc, next) {
  // console.log(doc)
  console.log(`Query took ${Date.now() - this.start} milliseconds`)
  next()
})

// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//   console.log(this.pipeline())
//   next()
// })

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
