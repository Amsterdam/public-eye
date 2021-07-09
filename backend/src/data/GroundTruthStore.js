const getGroundTruthById = (db) => async (groundTruthId) => {
  try {
    const query = 'SELECT * FROM ground_truths WHERE id = $1'

    const res = await db.query(query, [groundTruthId])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}


module.exports = ({ db }) => ({
  getGroundTruthById: getGroundTruthById(db)
})
