const SECJSCircle = require('../src/secjs-circle')
const should = require('chai').should()

describe('Circle', () => {
  describe('Get UTP server time', () => {
    it('shoud get server time', async () => {
      let circle = new SECJSCircle('DE')
      let msg = await circle._getUTCTimeFromServer()
      console.log(msg)
      should.not.equal(msg, '')
    })
  })
})
