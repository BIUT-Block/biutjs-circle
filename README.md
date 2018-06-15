# SECJSTimeCircle
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

This libaray would be used to get the next working group, which shoud begin to work.
This libary used dgram third-party libary to use udp protocoll, in case to send and get message from ntp server.

- Using ntp server pool to uniform unix time
- Every 30s switch to next group, which should to work

### API

#### `new secjsCircle(timezone)`
Instance a circle object and selected the nearest ntp server based on the timezone
- `timezone`: the region of timezone. such as. "de" for germany, "zh" for China

#### `secjsCircle.initialCircle()`
Initialize the timestamp, when the first group begin to work. Save the time stamp to attribute this.timeStampOfLastGroup

#### `secjsCircle.getWorkingGroupNumber(callback)`
This API is a aync method to get the next group number after a while
- `callback`: a callback function to get the caculated working group number

### Usage
To use the libary to get the next working group, you need to do following steps.
1. Select the nearest ntp server
```js
const SECjsCircle = require('<path of src>')
let secjsCircle = new SECjsCircle('de')
```
2. Initialize the time stamp of the circle if the group at the first time begin to work
```js
secjsCircle.initial()
```
3. Get the next group number, which should begin to work
```js
secjsCircle.getWorkingGroupNumber((nextWorkingGroupNumber) => {
    let workingGroupNumber = nextWorkingGroupNumber
    console.log(`The next working group should be ${workingGroupNumber}`)
})
```

#### License

MIT