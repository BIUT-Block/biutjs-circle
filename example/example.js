const SECjsCircle = require('../src/secjs-circle')

let circle = new SECjsCircle('DE')
let currentWorkingGroupNumberExample = 0
circle.initialCircle()
circle._calcTimeDifference((currentWorkingGroupNumber) => {
  currentWorkingGroupNumberExample = currentWorkingGroupNumber

  console.log(`Group Number ${currentWorkingGroupNumberExample} and time stamp ${circle.timeStampOfLastGroup}`)
})

setInterval(() => {
  circle._calcTimeDifference((currentWorkingGroupNumber) => {
    currentWorkingGroupNumberExample = currentWorkingGroupNumber

    console.log(`Group Number ${currentWorkingGroupNumberExample} and time stamp ${circle.timeStampOfLastGroup}`)
  })
}, 65000)
