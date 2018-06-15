const dgram = require('dgram')

class SECJSTimeCircle {
  /**
   * constructor of secjs time circle class
   * @param {string} timezone time zone to select a ntp server
   */
  constructor (timezone) {
    this.localHostTime = 0
    this.serverTime = 0
    this.ntpTimeServerAddress = ''
    this.circleTimeOut = 30 // the time out of one circle, every 30s need to be switched to next working group
    this.currentWorkingGroupNumber = 1
    this.timeStampOfLastGroup = 0 // the time stamp to get the last group
    this.sumOfGroups = 10
    this.timeDiff = 0 // the time difference between server unix time and local unix time
    switch (timezone) {
      case 'USA':
        this.ntpTimeServerAddress = 'us.pool.ntp.org'
        break
      case 'DE':
        this.ntpTimeServerAddress = 'de.pool.ntp.org'
        break
      case 'ZH':
        this.ntpTimeServerAddress = 'cn.pool.ntp.org'
        break
      default:
        this.ntpTimeServerAddress = 'de.pool.ntp.org'
        break
    }
  }

  /**
   * get local host unix time
   * @returns {number} local unix time
   */
  _getLocalHostTime () {
    this.localHostTime = Math.round((new Date()).getTime() / 1000)
    return this.localHostTime
  }

  /**
   * get unix time from time server
   * @return {Promise}
   */
  _getUTCTimeFromServer () {
    return new Promise((resolve, reject) => {
      let ntpClient = dgram.createSocket('udp4')
      let ntpData = Buffer.alloc(48)
      ntpData[0] = 0x1B
      ntpClient.on('error', (err) => {
        if (err) {
          ntpClient.close()
          reject(err)
        }
      })

      ntpClient.send(ntpData, 123, this.ntpTimeServerAddress, (err) => {
        if (err) {
          ntpClient.close()
          reject(err)
        }
      })

      ntpClient.once('message', (msg) => {
        let offsetTransmitTime = 40
        let intpart = 0
        let fractpart = 0
        ntpClient.close()
        // Get the seconds part
        for (var i = 0; i <= 3; i++) {
          intpart = 256 * intpart + msg[offsetTransmitTime + i]
        }
        // Get the seconds fraction
        for (i = 4; i <= 7; i++) {
          fractpart = 256 * fractpart + msg[offsetTransmitTime + i]
        }
        let milliseconds = (intpart * 1000 + (fractpart * 1000) / 0x100000000)
        var date = new Date('Jan 01 1900 GMT')
        date.setUTCMilliseconds(date.getUTCMilliseconds() + milliseconds)
        resolve(parseInt(date.getTime() / 1000))
      })
    })
  }

  /**
   * caculcate the time difference between server unix time and local unix time
   * save the result to attribute timeDiff
   */
  // async _calcTimeDifference (callback) {
  //   let serverTime = await this._getUTCTimeFromServer()
  //   let localTime = this._getLocalHostTime()
  //   let diffTime = serverTime - localTime
  //   let currentUnixTime = this._getLocalHostTime()
  //   let adjustedTime = currentUnixTime + this.timeDiff
  //   this.timeStampOfLastGroup = adjustedTime
  //   this.timeDiff = diffTime
  //   this.currentWorkingGroupNumber = 1
  //   callback(this.timeDiff, this.timeStampOfLastGroup, this.currentWorkingGroupNumber)
  // }

  async getWorkingGroupNumber (callback) {
    let serverTime = 0
    try {
      serverTime = await this._getUTCTimeFromServer()
    } catch (err) {
      throw Error(err)
    }
    let workingGroupNumber = this._calcNextWorkingGroupNumber(serverTime)
    // let localTime = this._getLocalHostTime()
    // let diffTime = serverTime - localTime
    // let currentUnixTime = this._getLocalHostTime()
    // let adjustedTime = currentUnixTime + this.timeDiff
    // this.timeStampOfLastGroup = adjustedTime
    // this.timeDiff = diffTime
    // this.currentWorkingGroupNumber = 1
    callback(workingGroupNumber)
  }

  // _calcTimeDifference (callback) {
  //   let serverTime = this._getUTCTimeFromServer()
  //   let localTime = this._getLocalHostTime()
  //   let diffTime = serverTime - localTime
  //   let currentUnixTime = this._getLocalHostTime()
  //   let adjustedTime = currentUnixTime + this.timeDiff
  //   this.timeStampOfLastGroup = adjustedTime
  //   this.timeDiff = diffTime
  //   //callback(this.timeDiff, this.timeStampOfLastGroup, this.currentWorkingGroupNumber)
  // }

  /**
   * initialize the circle
   * initial working group number 1
   * get the time different between local unix time and server unix time
   * save the timestamp of last group in attribute timeStampOfLastGroup
   */
  initialCircle () {
    this.timeStampOfLastGroup = this._getLocalHostTime()
  }

  /**
   * get next group, which shoud working
   * @param {unixTimeStamp} currentUnixTime
   */
  // getWorkingGroupNumber (currentUnixTime) {
  //   let adjustedUnixTime = currentUnixTime + this.timeDiff
  //   if (this.timeDiff || this.timeDiff < 0) {
  //     throw new Error(`Don't have any time different information. Use function initialCircle().`)
  //   }

  //   if (adjustedUnixTime < this.timeStampOfLastGroup) {
  //     throw new Error(`The time stamp is invalid.`)
  //   }

  //   let jumpToNextCircle = (adjustedUnixTime - this.timeStampOfLastGroup) / (this.circleTimeOut * 1000) + this.currentWorkingGroupNumber

  //   if (jumpToNextCircle < this.sumOfGroups + 1) {
  //     this.currentWorkingGroupNumber = jumpToNextCircle
  //   } else {
  //     this.currentWorkingGroupNumber = Math.ceil((jumpToNextCircle / 10))
  //   }
  //   this.timeStampOfLastGroup = adjustedUnixTime
  //   return this.currentWorkingGroupNumber
  // }

  _calcNextWorkingGroupNumber (currentUnixTime) {
    let jumpToNextCircle = (currentUnixTime - this.timeStampOfLastGroup) / this.circleTimeOut + this.currentWorkingGroupNumber
    console.log(`Jump to next group ${jumpToNextCircle}`)
    if (jumpToNextCircle < this.sumOfGroups + 1) {
      this.currentWorkingGroupNumber = Math.floor(jumpToNextCircle)
    } else {
      this.currentWorkingGroupNumber = Math.floor((jumpToNextCircle / 10))
      if (this.currentWorkingGroupNumber > 10) {
        this.currentWorkingGroupNumber = this.currentWorkingGroupNumber - 1
      }
    }
    this.timeStampOfLastGroup = currentUnixTime
    return this.currentWorkingGroupNumber
  }
}

module.exports = SECJSTimeCircle
