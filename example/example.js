const SECjsCircle = require('../src/secjs-circle')
const config = {
  circleTimeOut: 30,
  ntpTryOut: 0,
  timeServer: 'DE',
  sumOfGroups: 10
}

let circle = new SECjsCircle(config)
let currentWorkingGroupNumberExample = 0

circle.refreshTimeDifference((timeDiff, err) => {
  if (err) {
    console.log(`Error to get server Time ${err}`)
  }
  console.log(`The time difference between timeDiff ${timeDiff}`)
})

circle.initialCircle(() => {
  circle.refreshTimeDifference((timeDiff, err) => {
    if (err) {
      throw new Error(`Error at refresh time difference between local and server time ${err}`)
    }
    console.log(`Time Difference between local and server time ${timeDiff}`)
  })

  circle.getWorkingGroupNumber((currentWorkingGroupNumber) => {
    currentWorkingGroupNumberExample = currentWorkingGroupNumber
    console.log(`Group Number ${currentWorkingGroupNumberExample} and time stamp ${circle.timeStampOfLastGroup}`)
  })
})

setInterval(() => {
  circle.getWorkingGroupNumber((currentWorkingGroupNumber) => {
    currentWorkingGroupNumberExample = currentWorkingGroupNumber
    circle.getNextGroupBeginTimeDiff(circle.timeStampOfLastGroup, (timeDiff) => {
      console.log(`The Time to next group begin to work ${timeDiff}`)
    })
    circle.getNextPeriodeBeginTimeDiff(circle.timeStampOfLastGroup, (timeDiff) => {
      console.log(`The Time to next periode begin to work ${timeDiff}`)
    })
    console.log(`Group Number ${currentWorkingGroupNumberExample} and time stamp ${circle.timeStampOfLastGroup}`)
  })
}, 65000)
