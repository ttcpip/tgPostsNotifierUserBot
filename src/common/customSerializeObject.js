const { getCircularReplacer } = require('./getCircularReplacer')

/** @param {Object} obj any object */
function customSerializeObject(obj, i = 1) {
  let result = ''

  for (const key of Object.getOwnPropertyNames(obj || {})) {
    const value = obj[key]
    let valueStr = ''

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint' ||
      typeof value === 'undefined' ||
      value === null
    )
      valueStr = value.toString ? value.toString() : `${value}`
    else if (Buffer.isBuffer(value)) valueStr = '[Buffer]'
    else if (typeof value === 'object' && !Array.isArray(value))
      valueStr = `{\n${customSerializeObject(value, i + 1)}}`
    else valueStr = JSON.stringify(value, getCircularReplacer())

    result += `${'•'.repeat(i)}[${key}]: ${valueStr}\n`
  }

  return result
}

module.exports = { customSerializeObject }
