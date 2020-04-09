const express = require('express')
const authController = require('../controllers/authController')
const reviewController = require('../controllers/reviewController')

// (1)tours/:tourId/(2)reviews/:reviewId
// review 只能抓到(2)線路的params 我們要抓到上一級的(1)的params { mergeParams: true }
const router = express.Router({ mergeParams: true })

//POST tour/5e76f93609fc6116488419a8/reviews
//GET tour/5e76f93609fc6116488419a8/reviews
//POST /reviews
// 以上2線路都會跑以下的結果

router.use(authController.protect)
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user', 'admin'),
    reviewController.setTourUserId,
    reviewController.createReview
  )
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)

module.exports = router
