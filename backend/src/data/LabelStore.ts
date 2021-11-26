import { Database } from 'db'
import { ObjectLabel } from 'typescript-types'

const getLabels = (db: Database) => async (): Promise<ObjectLabel[] | null> => {
  try {
    const query = 'SELECT * FROM labels'
    const res = await db.query<ObjectLabel>(query)
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertLabel = (db: Database) => async (
  name: string,
  rgb: string,
): Promise<ObjectLabel | null> => {
  try {
    const query = 'INSERT INTO labels (name, rgb) VALUES ($1, $2) RETURNING *'
    const res = await db.query<ObjectLabel>(query, [name, rgb])
    return res ? res.rows[0] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type LabelStoreType = {
  getLabels: ReturnType<typeof getLabels>,
  insertLabel: ReturnType<typeof insertLabel>,
}

const LabelStore = ({ db }: { db: Database }): LabelStoreType => ({
  getLabels: getLabels(db),
  insertLabel: insertLabel(db),
})

export default LabelStore
