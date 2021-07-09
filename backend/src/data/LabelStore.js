const getLabels = (db) => async () => {
  try {
    const query = "SELECT * FROM labels"
    const res = await db.query(query)
    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertLabel = (db) => async (name, rgb) => {
  try {
    const query = "INSERT INTO labels (name, rgb) VALUES ($1, $2) RETURNING *"
    const res = await db.query(query, [name, rgb])
    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const LabelStore = ({ db }) => ({
  getLabels: getLabels(db),
  insertLabel: insertLabel(db),
})

module.exports = LabelStore