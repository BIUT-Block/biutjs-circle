const dgram = require('dgram')
const fs = require('fs')
const ntpPort = 123

class SECJSTimeCircle {
  /**
   * constructor of secjs time circle class
   * @param {string} config.circleTimeOut time out of a circle
   * @param {number} config.sumOfGroups sum of the group
   * @param {string} config.timeServer the server's local; 'DE': German 'USA': USA 'ZH': China
   * @param {number} config.ntpTryOut try out time for udp transport
   * @param {string} config.filePath path to save the time difference
   * @param {bool} config.isMiningdHost is the host a mining host
   */
  constructor (config) {
    this.localHostTime = 0
    this.serverTime = 0
    this.ntpTimeServerAddress = ''
    this.ntpTryOut = config.ntpTryOut // how many times should retry to get unix time
    this.circleTimeOut = config.circleTimeOut // the time out of one circle, every 30s need to be switched to next working group
    this.filePath = config.filePath || 'timeDiff.txt'
    this.isMiningdHost = config.isMiningdHost || true
    this.currentWorkingGroupNumber = 1
    this.timeStampOfLastGroup = 0 // the time stamp to get the last group
    this.sumOfGroups = config.sumOfGroups
    this.beginWorkTimeStamp = 0 // the unix time stamp at genesis time
    this.timeDiff = 0 // the time difference between server unix time and local unix time
    switch (config.timeServer) {
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
  _asyncGetUTCTimeFromServer () {
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

      ntpClient.send(ntpData, ntpPort, this.ntpTimeServerAddress, (err) => {
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

  async getWorkingGroupNumber (callback) {
    let serverTime = 0
    let tryOut = 0
    try {
      serverTime = await this._asyncGetUTCTimeFromServer()
    } catch (err) {
      tryOut = tryOut + 1
      if (tryOut === this.ntpTryOut) {
        throw Error(err)
      }
      serverTime = await this._asyncGetUTCTimeFromServer()
    }
    let workingGroupNumber = this._calcNextWorkingGroupNumber(serverTime)

    callback(workingGroupNumber)
  }

  /**
   * get the time difference
   */
  async refreshTimeDifference (callback) {
    let localHostTime = this._getLocalHostTime()
    let serverTime = 0
    let tryOut = 0
    try {
      serverTime = await this._asyncGetUTCTimeFromServer()
      this.timeDiff = localHostTime - serverTime
      this._writeTimeDiffToFile()
      callback(this.timeDiff, undefined)
    } catch (err) {
      tryOut = tryOut + 1
      if (tryOut === this.ntpTryOut) {
        callback(serverTime, err)
        throw Error(err)
      }
      serverTime = await this._asyncGetUTCTimeFromServer()
      this.timeDiff = localHostTime - serverTime
      this._writeTimeDiffToFile()
      callback(this.timeDiff, undefined)
    }
  }

  /**
   * initialize the circle
   * initial working group number 1
   * get the time different between local unix time and server unix time
   * save the timestamp of last group in attribute timeStampOfLastGroup
   */
  async initialCircle (callback) {
    try {
      this.timeStampOfLastGroup = await this._asyncGetUTCTimeFromServer()
      this.beginWorkTimeStamp = this.timeStampOfLastGroup
      callback()
    } catch (err) {
      if (fs.existsSync(this.filePath)) {
        fs.readFile(this.filePath, (err, data) => {
          if (err) {
            throw new Error(`Can't get time difference from file.`)
          }
          this.timeDiff = data.toString
          this.timeStampOfLastGroup = this._getLocalHostTime + this.timeDiff
          this.beginWorkTimeStamp = this.timeStampOfLastGroup
        })
      } else {
        if (this.isMiningdHost) {
          throw new Error(`Can't get time difference from server.`)
        } else {
          this.timeStampOfLastGroup = this._getLocalHostTime()
          this.beginWorkTimeStamp = this.timeStampOfLastGroup
        }
      }
    }
  }

  _calcNextWorkingGroupNumber (currentUnixTime) {
    let jumpToNextCircle = (currentUnixTime - this.timeStampOfLastGroup) / this.circleTimeOut + this.currentWorkingGroupNumber
    console.log(`Jump to next group ${jumpToNextCircle}`)
    if (jumpToNextCircle < this.sumOfGroups + 1) {
      this.currentWorkingGroupNumber = Math.floor(jumpToNextCircle)
    } else {
      this.currentWorkingGroupNumber = Math.floor((jumpToNextCircle / 10))
    }
    this.timeStampOfLastGroup = currentUnixTime
    return this.currentWorkingGroupNumber
  }

  _writeTimeDiffToFile () {
    fs.writeFile(this.filePath, this.timeDiff, (err) => {
      if (err) {

      }
    })
  }

  /**
   * get the time to next group begin to work
   * @param {number} currentUnixTime
   * @param {function} callback
   */
  getNextGroupBeginTimeDiff (currentUnixTime, callback) {
    let periodeRedundance = (currentUnixTime - this.beginWorkTimeStamp) % this.circleTimeOut
    let timeDiff = this.circleTimeOut - periodeRedundance

    callback(timeDiff)
  }

  /**
   * get the time to next periode begin
   * @param {number} currentUnixTime
   * @param {function} callback
   */
  getNextPeriodeBeginTimeDiff (currentUnixTime, callback) {
    let periodeTime = this.circleTimeOut * this.sumOfGroups
    let periodeRedundance = periodeTime - (currentUnixTime - this.beginWorkTimeStamp) % periodeTime

    callback(periodeRedundance)
  }
}

module.exports = SECJSTimeCircle
