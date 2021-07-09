const R = require('ramda')
const fs = require('fs')

const getAllTrainingRunsByUserId = (db) => async (userId, skip, limit) => {
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

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllTrainingRuns = (db) => async (skip, limit) => {
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

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalTrainingRunsCount = (db) => async () => {
  try {
    const query = `
      SELECT count(*) FROM training_runs
    `

    const res = await db.query(query)
    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTotalTrainingRunsCountByUserId = (db) => async (userId) => {
  try {
    const query = `
      SELECT count(*) FROM training_runs
      JOIN jobs ON training_runs.job_id = jobs.id
      WHERE jobs.created_by_user_id = $1
    `

    const res = await db.query(query, [userId])
    return res.rows[0].count || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertTrainingRun = (db) => async (trainScript, jobId, trainSetId, valSetId) => {
  try {
    const neuralNetwork = await db.query('SELECT * FROM neural_networks WHERE train_script = $1', [trainScript])
    const neuralNetworkId = R.path(['rows', 0, 'id'], neuralNetwork) || null

    const logFilePath = `${process.env['EAGLE_EYE_PATH']}/files/logs/${jobId}_train_log.csv`

    // create file
    fs.writeFile(logFilePath, '', (err, file) => {
      if (err) new Error(err)
    })
    const query = 'INSERT INTO training_runs (date, neural_network_id, job_id, training_set_id, validation_set_id, log_file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id'
    const res = await db.query(query, [new Date(), neuralNetworkId, jobId, trainSetId, valSetId, logFilePath])
    const id = res.rows[0].id

    // retrieve the just inserted training run with the score, model and neural network
    const selectQuery = `
      SELECT training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.annotation as model_annotation, models.name as model_name, neural_network_type.name as nn_type
      FROM training_runs
      LEFT JOIN models ON training_runs.model_id = models.id
      LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
      LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
      JOIN jobs ON training_runs.job_id = jobs.id
      WHERE training_runs.id = $1`
    const selectRes = await db.query(selectQuery, [id])
    return selectRes.rows[0] || null
  } catch (e) {
    console.error(e)
    return false
  }
}

const getTrainingRunById = (db) => async (id) => {
  try {
    const query = `
    SELECT *, training_runs.id as id, train_script, date, config_id, job_id, job_status, job_script_payload, models.id as model_id, models.annotation as model_annotation, models.name as model_name, models.path as model_path, neural_network_type.name as nn_type
    FROM training_runs
    LEFT JOIN models ON training_runs.model_id = models.id
    LEFT JOIN neural_networks ON training_runs.neural_network_id = neural_networks.id
    LEFT JOIN neural_network_type ON neural_network_type.id = neural_networks.nn_type_id
    JOIN jobs ON training_runs.job_id = jobs.id
    WHERE training_runs.id = $1`

    const res = await db.query(query, [id])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTrainingRunByJobId = (db) => async (id) => {
  try {
    const query = "SELECT * FROM training_runs WHERE job_id = $1"
    const res = await db.query(query, [id])

    return res.rows[0] || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getScoresByTrainingRunId = (db) => async (id) => {
  try {
    const query = 'SELECT * FROM scores WHERE training_run_id = $1'

    const res = await db.query(query, [id])

    return res.rows || null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteScoresByTrainingRunId = (db) => async (id) => {
  try {
    const query = 'DELETE FROM scores WHERE training_run_id = $1'

    await db.query(query, [id])
  } catch (e) {
    console.error(e)
    return null
  }
}

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

const deleteTrainConfigById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM train_configs WHERE id = $1'

    await db.query(query, [id])
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteTrainingRunById = (db) => async (id) => {
  try {
    const query = 'DELETE FROM training_runs WHERE id = $1'

    await db.query(query, [id])
  } catch (e) {
    console.error(e)
    return null
  }
}

const TrainingRunStore = ({db}) => ({
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
    
module.exports = TrainingRunStore
  