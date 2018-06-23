const SECJSCircle = require('../src/secjs-circle')
const should = require('chai').should()
const assert = require('chai').assert

describe('Circle', () => {
  describe('Intial Working Group Information', () => {
    it('Return the german ntp server', () => {
      let circle = new SECJSCircle('DE')
      assert.equal(circle.ntpTimeServerAddress, 'de.pool.ntp.org')
    })

    it('Return ntp server in other lands', () => {
      let circle = new SECJSCircle('JP')
      assert.equal(circle.ntpTimeServerAddress, 'de.pool.ntp.org')
    })

    it('Initial the time stamp of the last working group', () => {
      let circle = new SECJSCircle('DE')
      circle.initialCircle(() => {
        assert.equal(circle.timeStampOfLastGroup, Math.round((new Date()).getTime() / 1000))
      })
    })
  })
})
