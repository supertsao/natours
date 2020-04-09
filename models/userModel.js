const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'User must have a Email'],
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email!']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guid', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlength: 8,
    // 隱藏欄位
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // only work on User.save or User.create
      validator: function(el) {
        return el === this.password
      },
      message: 'Password are not the same'
    }
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordRestExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 8)
  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next()
  // 這個passwordChangeAt 和token是同時發新的 故有可能會出現passwordChangeAt比token時間長 所以減去一秒
  this.passwordChangeAt = Date.now() - 1000
  next()
})

userSchema.pre(/^find/, function(next) {
  // this point to current query
  this.find({ active: { $ne: false } })
  next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changePasswordAfter = async function(JWTTIMESTAMP) {
  if (this.passwordChangeAt) {
    const changeTimeStamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10)
    return JWTTIMESTAMP < changeTimeStamp
  }
  return false
}

userSchema.methods.createPasswordResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // 30分鐘
  this.passwordRestExpires = Date.now() + 30 * 60 * 1000
  return resetToken
}
const User = mongoose.model('User', userSchema)
module.exports = User
