import { Database } from 'db'
import { GroundTruth } from 'typescript-types'

const getGroundTruthById = (db: Database) => async (
  groundTruthId: string,
): Promise<GroundTruth | null> => {
  try {
    const query = 'SELECT * FROM ground_truths WHERE id = $1'

    const res = await db.query(query, [groundTruthId])
    return res ? res.rows[0] as GroundTruth : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type GroundTruthStoreType = {
  getGroundTruthById: ReturnType<typeof getGroundTruthById>,
}

export default ({ db }: { db: Database }): GroundTruthStoreType => ({
  getGroundTruthById: getGroundTruthById(db),
})
