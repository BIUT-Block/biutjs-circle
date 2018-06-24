// const dgram = require('dgram')
const fs = require('fs')
const Secjsutil = require('@sec-block/secjs-util')
// const ntpPort = 123

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
    this.SecjsUtil = new Secjsutil({
      timeServer: config.timeServer
    })
  }

  /**
   * get local host unix time
   * @returns {number} local unix time
   */
  _getLocalHostTime () {
    this.localHostTime = Math.round((new Date()).getTime() / 1000)
    return this.localHostTime
  }

  async getWorkingGroupNumber (callback) {
    let serverTime = 0
    let tryOut = 0
    try {
      serverTime = await this.SecjsUtil.asyncGetUTCTimeFromServer()
    } catch (err) {
      tryOut = tryOut + 1
      if (tryOut === this.ntpTryOut) {
        throw Error(err)
      }
      serverTime = await this.SecjsUtil.asyncGetUTCTimeFromServer()
    }
    let workingGroupNumber = this._calcNextWorkingGroupNumber(serverTime)

    callback(workingGroupNumber)
  }

  /**
   * initialize the circle
   * initial working group number 1
   * get the time different between local unix time and server unix time
   * save the timestamp of last group in attribute timeStampOfLastGroup
   */
  async initialCircle (callback) {
    try {
      this.timeStampOfLastGroup = await this.SecjsUtil.asyncGetUTCTimeFromServer()
      this.beginWorkTimeStamp = this.timeStampOfLastGroup
      callback()
    } catch (err) {
      if (fs.existsSync(this.filePath)) {
        fs.readFile(this.filePath, (err, data) => {
          if (err) {
            throw new Error(`Can't get time difference from file.`)
          }
          this.timeDiff = data.toString
          this.timeStampOfLastGroup = this.SecjsUtil.currentUnixTimeSecond() + this.timeDiff
          this.beginWorkTimeStamp = this.timeStampOfLastGroup
        })
      } else {
        if (this.isMiningdHost) {
          throw new Error(`Can't get time difference from server.`)
        } else {
          this.timeStampOfLastGroup = this.SecjsUtil.currentUnixTimeSecond()
          this.beginWorkTimeStamp = this.timeStampOfLastGroup
        }
      }
    }
  }

  _calcNextWorkingGroupNumber (currentUnixTime) {
    let jumpToNextCircle = (currentUnixTime - this.timeStampOfLastGroup) / this.circleTimeOut + this.currentWorkingGroupNumber
    // console.log(`Jump to next group ${jumpToNextCircle}`)
    if (jumpToNextCircle < this.sumOfGroups + 1) {
      this.currentWorkingGroupNumber = Math.floor(jumpToNextCircle)
    } else {
      this.currentWorkingGroupNumber = Math.floor((jumpToNextCircle / 10))
    }
    this.timeStampOfLastGroup = currentUnixTime
    return this.currentWorkingGroupNumber
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
