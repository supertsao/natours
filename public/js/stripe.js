import axios from 'axios'
import { showAlert } from './alert.js'
// const stripe = require('stripe')('pk_test_GX1f7FqLRCzwCMEeZQU2itn800niDIKZEU')
const stripe = Stripe('pk_test_GX1f7FqLRCzwCMEeZQU2itn800niDIKZEU')

// https://stripe.com/docs/payments/checkout/one-time
export const bookTour = async tourId => {
  // 1)get checkout session from api
  try {
    const session = await axios(`http://127.0.0.1:6600/api/v1/booking/checkout-session/${tourId}`)
    console.log(session)
    console.log(session.data.session.id)
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch (err) {
    console.log(err)
    showAlert('Error', err)
  }
}
