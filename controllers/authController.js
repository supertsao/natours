const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('./../utils/catchAsync.js')
const AppError = require('./../utils/AppError')
const Email = require('./../utils/email')
const bcrypt = require('bcryptjs')

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id)

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true // 只有https才能用

  res.cookie('jwt', token, cookieOptions)
  user.password = undefined
  res.status(statusCode).json({
    status: 'success',
    token,
    data: user
  })
}
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role
  })
  // http://127.0.0.1:6600/me
  const url = `${req.protocol}://${req.get('host')}/me`
  await new Email(newUser, url).sendWelcome()
  createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  // 1. 檢查email,password是否存在
  if (!email || !password) {
    return next(new AppError('Please provide a valid email and password', 400))
  }
  // 2. 檢查email,password是否正確
  const user = await User.findOne({ email }).select('+password')
  // console.log(user)

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or password', 401))
  }
  // 3.把token丟給client
  createSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
  //  1.拿到token
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token) {
    return next(new AppError('You are not login Please login to get access', 401))
  }
  // 2.檢查token是否正確
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  // 3.檢查擁有這個token的user帳號是否還在
  const currentUser = await User.findById(decoded.id)
  if (!currentUser) {
    return next(new AppError('擁有此token的使用者帳號已刪除', 401))
  }
  // 4.檢查使用者token創立後密碼是否更改
  if (await currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('使用者已更新密碼 請重新登入', 401))
  }
  // 取得權限
  req.user = currentUser
  res.locals.user = currentUser
  next()
})

// 只是用來渲染網頁 沒有error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

      const currentUser = await User.findById(decoded.id)
      if (!currentUser) {
        return next()
      }
      if (await currentUser.changePasswordAfter(decoded.iat)) {
        return next()
      }
      res.locals.user = currentUser
      return next()
    } catch (err) {
      return next()
    }
  }
  next()
}

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  res.status(200).json({
    status: 'success'
  })
}

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`只有權限是${roles}才能使用 你目前權限是${req.user.role}`), 401)
    }
    next()
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 拿到使用者email
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError('查無此email使用者'), 404)
  }
  // 產生沒加密過的token 而資料庫已儲存一筆加密過的token
  const resetToken = await user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // 把信件寄給使用者

  // const message = `Forgot your password? submit a patch request with your new password and password confirmation to ${resetURL}\n
  // if you didnt forget your password please ignore this email`

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    // await sendEmail({
    //   email: user.email,
    //   subject: 'your password reset token(valid for 10 mins)',
    //   message
    // })
    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token send to Email!'
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    return next(new AppError('There was an error sending email,try again later'), 500)
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 拿到傳進來的token 和在資料庫儲存的加密token比對
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  //  只有拿到hashedToken我們才能比對資料庫的passwordResetToken 找到該user 找到user還要比對token是否過期
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordRestExpires: { $gt: Date.now() }
  })
  if (!user) {
    return next(new AppError('無效或過期的token', 401))
  }
  // 讓使用者設置新的password
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordRestExpires = undefined
  await user.save()

  // 標註使用者更新password 用一個middleware改
  // 給新的token
  createSendToken(user, 200, res)
})
// 使用者帳號密碼都知道 要改新密碼
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('密碼錯誤', 401))
  }
  user.password = req.body.newPassword
  user.passwordConfirm = req.body.newPasswordConfirm
  await user.save()
  // 一定要用model.save或model.create password的validation才會有作用
  createSendToken(user, 200, res)
})
