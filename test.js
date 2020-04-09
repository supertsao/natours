// const filterObj = (obj, ...allowedFields) => {
//   const newObj = {}
//   Object.keys(obj).forEach(el => {
//     if (allowedFields.includes(el)) newObj[el] = obj[el]
//   })
//   return newObj
// }
const filterObj = obj => {
  const a = Object.keys(obj).forEach(el => {
    el + '1'
  })
  return a
}

const info = {
  name: 'bingo',
  email: 'bingo@gmail.com',
  telephone: '0912784876',
  address: '1133 West Third Street'
}

// const filterBody = filterObj(info, 'name', 'email')
// console.log(filterBody)

const check = filterObj(info)
console.log(check)
