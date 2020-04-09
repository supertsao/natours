const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync.js')
const factory = require('./handlerFactory.js')

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourID)

  const session = await stripe.checkout.sessions.create({
    // 這個路線指向的是首頁
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  })

  res.status(200).json({
    status: 'success',
    session
  })
})

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // 暫時使用 不安全 如果知道規則每個人都可以買旅遊團不付錢是不對的
  const { tour, user, price } = req.query
  if (!tour && !user && !price) return next()
  await Booking.create({ tour, user, price })

  // ${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${
  // (req.originalUrl.split('?')[0] 可以得到?前面的url
  res.redirect(req.originalUrl.split('?')[0])
})

exports.createBooking=factory.createOne(Booking)
exports.getBooking=factory.getOne(Booking)
exports.getAllBooking=factory.getAll(Booking)
exports.updateBooking=factory.updateOne(Booking)
exports.deleteBooking=factory.deleteOne(Booking)
