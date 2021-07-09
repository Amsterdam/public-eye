const { Pool } = require('pg')

let pool = null

const connect = async (config) => {
  if (pool != null) {
    return
  }

  try {
    pool  = new Pool(config)

    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })        
    
    await pool.connect()
  } catch (e) {
    console.error(e)
    pool = null
  } 
  
  return
}

const query = (queryString, values) => {
    return pool.query(queryString, values)
}

const queryOne = async (queryString, value, defaultVal = {}) => {
  const res = await query(queryString, value)

  return (res.rows.length > 0 ? res.rows[0] : defaultVal) || defaultVal
}

module.exports = {
  connect,
  query,
  queryOne,
}
