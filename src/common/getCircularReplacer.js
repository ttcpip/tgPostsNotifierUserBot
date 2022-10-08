function getCircularReplacer() {
  const seen = new WeakSet()

  return (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[circular]'
      seen.add(value)
    }
    return value
  }
}

module.exports = { getCircularReplacer }
