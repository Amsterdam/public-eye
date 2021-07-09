const getTrainConfigById = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM train_configs WHERE id = $1'

    const res = await db.query(query, [id])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}


const TrainingConfigStore = ({db}) => ({
  getTrainConfigById: getTrainConfigById(db),
})
      
module.exports = TrainingConfigStore
