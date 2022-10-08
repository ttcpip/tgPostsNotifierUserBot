function toHHMMSS(secondsNum_) {
  const secondsNum = Math.trunc(secondsNum_)
  const hours = Math.floor(secondsNum / 3600)
  const minutes = Math.floor(secondsNum / 60) % 60
  const seconds = secondsNum % 60

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? '0' + v : v))
    .filter((v, i) => v !== '00' || i > 0)
    .join(':')
}

module.exports = { toHHMMSS }
