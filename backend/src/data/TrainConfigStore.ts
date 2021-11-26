import { Database } from 'db'
import {
  TrainConfig as TrainConfigDB,
} from 'typescript-types'

const getTrainConfigById = (db: Database) => async (
  id: string,
): Promise<TrainConfigDB | null> => {
  try {
    const query = 'SELECT * FROM train_configs WHERE id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows[0] as TrainConfigDB : null
  } catch (e) {
    console.error(e)
    return null
  }
}

export type TrainConfigStoreType = {
  getTrainConfigById: ReturnType<typeof getTrainConfigById>,
}

const TrainingConfigStore = ({ db }: { db: Database }): TrainConfigStoreType => ({
  getTrainConfigById: getTrainConfigById(db),
})

export default TrainingConfigStore
