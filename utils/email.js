const nodemailer = require('nodemailer')
const ejs = require('ejs')
const htmlToText = require('html-to-text')

module.exports = class email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url
    this.from = `CEO<${process.env.EMAIL_FROM}>`
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      })
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }
  async send(template, subject) {
    // 1) render html base on ejs template
    const html = await ejs.renderFile(`${__dirname}/../views/email/${template}.ejs`, {
      firstName: this.firstName,
      url: this.url,
      subject
    })
    // 2) define email option
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    }
    // 3) create transport and send email

    await this.newTransport().sendMail(mailOptions)
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family')
  }
  async sendPasswordReset() {
    await this.send('passwordReset', 'Your Password reset Token (valid for only 10 minutes )')
  }
}

// const sendEmail = async options => {
//   // 1)宣告發信物件
//   const transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   })

//   const mailOptions = {
//     from: 'Chinlun<admin@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//   }

//   await transport.sendMail(mailOptions)
// }

// module.exports = sendEmail
