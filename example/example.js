const SECjsCircle = require('../src/secjs-circle')

let circle = new SECjsCircle('DE')
let currentWorkingGroupNumberExample = 0
circle.initialCircle()
circle.getWorkingGroupNumber((currentWorkingGroupNumber) => {
  currentWorkingGroupNumberExample = currentWorkingGroupNumber

  console.log(`Group Number ${currentWorkingGroupNumberExample} and time stamp ${circle.timeStampOfLastGroup}`)
})

setInterval(() => {
  circle.getWorkingGroupNumber((currentWorkingGroupNumber) => {
    currentWorkingGroupNumberExample = currentWorkingGroupNumber

    console.log(`Group Number ${currentWorkingGroupNumberExample} and time stamp ${circle.timeStampOfLastGroup}`)
  })
}, 65000)
