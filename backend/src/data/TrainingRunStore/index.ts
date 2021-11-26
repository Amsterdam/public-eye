import { path } from 'ramda'
import fs from 'fs'
import { Database } from 'db'
import {
  TrainingRun,
  TrainConfig,
} from 'typescript-types'

const getAllTrainingRunsByUserId = (db: Database) => async (
  userId: number,
  skip?: number,
  limit?: number,
) => {
  try {
    let query = `
      SELECT training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.name as model_name, models.annotation as model_annotation, models.path as model_path, neural_network_type.name as nn_type
      FROM training_runs
      LEFT JOIN models ON training_runs.model_id = models.id
      LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
      LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
      JOIN jobs ON training_runs.job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
      ORDER BY jobs.creation_date DESC`

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query, [userId])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllTrainingRuns = (db: Database) => async (
  skip?: number,
  limit?: number,
) => {
  try {
    let query = `
      SELECT training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.name as model_name, models.annotation as model_annotation, models.path as model_path, neural_network_type.name as nn_type
      FROM training_runs
      LEFT JOIN models ON training_runs.model_id = models.id
      LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
      LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
      JOIN jobs ON training_runs.job_id = jobs.id
      ORDER BY jobs.creation_date DESC`

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query)

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalTrainingRunsCount = (db: Database) => async (
): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM training_runs
    `

    const res = await db.query<number>(query)
    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalTrainingRunsCountByUserId = (db: Database) => async (
  userId: number,
): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM training_runs
      JOIN jobs ON training_runs.job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
    `

    const res = await db.query<number>(query, [userId])
    return res ? path(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertTrainingRun = (db: Database) => async (
  trainScript: string,
  jobId: number,
  trainSetId: number,
  valSetId: number,
): Promise<TrainingRun | null> => {
  try {
    const neuralNetwork = await db.query('SELECT * FROM neural_networks WHERE train_script = $1', [trainScript])
    const neuralNetworkId = path(['rows', 0, 'id'], neuralNetwork) || null

    const logFilePath = `${String(process.env.EAGLE_EYE_PATH)}/files/logs/${jobId}_train_log.csv`

    // create file
    fs.writeFile(logFilePath, '', (err) => {
      if (err) throw err
    })
    const query = 'INSERT INTO training_runs (date, neural_network_id, job_id, training_set_id, validation_set_id, log_file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id'
    const res = await db.query(
      query,
      [
        new Date(),
        neuralNetworkId,
        jobId,
        trainSetId,
        valSetId,
        logFilePath,
      ],
    )
    const id = path(['rows', 0, 'id'], res)

    // retrieve the just inserted training run with the score, model and neural network
    const selectQuery = `
      SELECT training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.annotation as model_annotation, models.name as model_name, neural_network_type.name as nn_type
      FROM training_runs
      LEFT JOIN models ON training_runs.model_id = models.id
      LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
      LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
      JOIN jobs ON training_runs.job_id = jobs.id
      WHERE training_runs.id = $1`
    const selectRes = await db.query<TrainingRun>(selectQuery, [id])
    return selectRes ? selectRes.rows[0] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTrainingRunById = (db: Database) => async (
  id: number,
): Promise<TrainingRun | null> => {
  try {
    const query = `
    SELECT *, training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.annotation as model_annotation, models.name as model_name, models.path as model_path, neural_network_type.name as nn_type
    FROM training_runs
    LEFT JOIN models ON training_runs.model_id = models.id
    LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
    LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
    JOIN jobs ON training_runs.job_id = jobs.id
    WHERE training_runs.id = $1`

    const res = await db.query<TrainingRun>(query, [id])

    return res ? res.rows[0] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTrainingRunByJobId = (db: Database) => async (
  id: number,
): Promise<TrainingRun | null> => {
  try {
    const query = `
      SELECT *, training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.annotation as model_annotation, models.name as model_name, models.path as model_path, neural_network_type.name as nn_type
      FROM training_runs
      LEFT JOIN models ON training_runs.model_id = models.id
      LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
      LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
      JOIN jobs ON training_runs.job_id = jobs.id
      WHERE training_runs.job_id = $1`
    const res = await db.query<TrainingRun>(query, [id])

    return res ? res.rows[0] : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getScoresByTrainingRunId = (db: Database) => async (
  id: number,
) => {
  try {
    const query = 'SELECT * FROM scores WHERE training_run_id = $1'

    const res = await db.query(query, [id])

    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteScoresByTrainingRunId = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM scores WHERE training_run_id = $1'

    await db.query(query, [id])

    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getTrainConfigById = (db: Database) => async (
  id: number,
): Promise<TrainConfig | null > => {
  try {
    const query = 'SELECT * FROM train_configs WHERE id = $1'

    const res = await db.query(query, [id])
    return res ? res.rows[0] as TrainConfig : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteTrainConfigById = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM train_configs WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteTrainingRunById = (db: Database) => async (
  id: number,
): Promise<boolean> => {
  try {
    const query = 'DELETE FROM training_runs WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export type TrainingRunStoreType = {
  getTotalTrainingRunsCount: ReturnType<typeof getTotalTrainingRunsCount>,
  getTotalTrainingRunsCountByUserId: ReturnType<typeof getTotalTrainingRunsCountByUserId>,
  getAllTrainingRunsByUserId: ReturnType<typeof getAllTrainingRunsByUserId>,
  deleteTrainingRunById: ReturnType<typeof deleteTrainingRunById>,
  getTrainConfigById: ReturnType<typeof getTrainConfigById>,
  deleteTrainConfigById: ReturnType<typeof deleteTrainConfigById>,
  deleteScoresByTrainingRunId: ReturnType<typeof deleteScoresByTrainingRunId>,
  insertTrainingRun: ReturnType<typeof insertTrainingRun>,
  getTrainingRunById: ReturnType<typeof getTrainingRunById>,
  getTrainingRunByJobId: ReturnType<typeof getTrainingRunByJobId>,
  getAllTrainingRuns: ReturnType<typeof getAllTrainingRuns>,
  getScoresByTrainingRunId: ReturnType<typeof getScoresByTrainingRunId>,
}

const TrainingRunStore = ({ db }: { db: Database }): TrainingRunStoreType => ({
  getTotalTrainingRunsCount: getTotalTrainingRunsCount(db),
  getTotalTrainingRunsCountByUserId: getTotalTrainingRunsCountByUserId(db),
  getAllTrainingRunsByUserId: getAllTrainingRunsByUserId(db),
  deleteTrainingRunById: deleteTrainingRunById(db),
  getTrainConfigById: getTrainConfigById(db),
  deleteTrainConfigById: deleteTrainConfigById(db),
  deleteScoresByTrainingRunId: deleteScoresByTrainingRunId(db),
  insertTrainingRun: insertTrainingRun(db),
  getTrainingRunById: getTrainingRunById(db),
  getTrainingRunByJobId: getTrainingRunByJobId(db),
  getAllTrainingRuns: getAllTrainingRuns(db),
  getScoresByTrainingRunId: getScoresByTrainingRunId(db),
})

export default TrainingRunStore
