import { path as Rpath } from 'ramda'
import { Database } from 'db'
import { Model, ModelTag } from 'typescript-types'

const getModels = (db: Database) => async (nnId: number) => {
  try {
    const query = `
      SELECT
        models.*,
        array_remove(array_agg(model_tags.name), NULL) as tags,
        array_remove(array_agg(
          case 
            when scores.score_name is null then null
            else jsonb_build_object(scores.score_name, scores.score_value)
          end
        ), NULL) as scores
      FROM models
      LEFT JOIN model_tags_link ON model_tags_link.model_id = models.id
      LEFT JOIN model_tags ON model_tags.id = model_tags_link.model_tags_id
      LEFT JOIN training_runs ON training_runs.model_id = models.id
      LEFT JOIN scores ON scores.training_run_id = training_runs.id
      WHERE models.neural_network_id = $1
      GROUP BY models.id
      ORDER BY models.id`
    const res = await db.query(query, [nnId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllModels = (db: Database) => async (
  skip: number,
  limit: number,
) => {
  try {
    let query = 'SELECT * FROM models'

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

const getAllModelsCount = (db: Database) => async (): Promise<number | null> => {
  try {
    const query = 'SELECT count(*) FROM models'

    const res = await db.query(query)
    return res ? Rpath(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getNeuralNetworks = (db: Database) => async () => {
  try {
    const query = `
      SELECT
        *,
        neural_networks.id as id,
        neural_network_type.name as nn_type,
        neural_networks.name as name
      FROM neural_networks
      JOIN neural_network_type
        ON neural_network_type.id = neural_networks.nn_type_id
    `
    const res = await db.query(query)
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteModelById = (db: Database) => async (id: number) => {
  try {
    const query = 'DELETE FROM models WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getModelById = (db: Database) => async (
  id: number,
): Promise<Model | null> => {
  try {
    const query = `
      SELECT
        models.*,
        training_runs.config_id as train_config_id,
        training_runs.id as train_run_id
      FROM models
      LEFT JOIN training_runs ON training_runs.model_id = models.id
      WHERE models.id = $1
    `

    const res = await db.query(query, [id])
    return res ? res.rows[0] as Model : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertModel = (db: Database) => async (
  nnId: number,
  path: string,
  name: string,
) => {
  try {
    const query = 'INSERT INTO models (neural_network_id, path, name) VALUES ($1, $2, $3)'

    await db.query(query, [nnId, path, name])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const updateAnnotation = (db: Database) => async (
  modelId: number,
  {
    annotation,
  }: {
    annotation: string,
  },
): Promise<Model | null> => {
  try {
    const query = 'UPDATE models SET annotation = $2 WHERE id = $1 RETURNING *'

    const res = await db.query(query, [modelId, annotation])
    return res ? res.rows[0] as Model : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertModelTag = (db: Database) => async (
  {
    name,
  }: {
    name: string,
  },
): Promise<ModelTag | null> => {
  try {
    const query = 'INSERT INTO model_tags (name) VALUES ($1) RETURNING *'

    const res = await db.query(query, [name])
    return res ? res.rows[0] as ModelTag : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getModelTags = (db: Database) => async () => {
  try {
    const query = 'SELECT * FROM model_tags'

    const res = await db.query(query)
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const insertModelTagLink = (db: Database) => async (
  modelId: number,
  modelTagsId: number,
) => {
  try {
    const query = 'INSERT INTO model_tags_link (model_id, model_tags_id) VALUES ($1, $2)'

    const res = await db.query(query, [modelId, modelTagsId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getTagsForModel = (db: Database) => async (modelId: number) => {
  try {
    const query = `
      SELECT model_tags.id, model_tags.name
      FROM model_tags
      JOIN model_tags_link ON model_tags.id = model_tags_link.model_tags_id
      WHERE model_tags_link.model_id = $1`

    const res = await db.query(query, [modelId])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteModelTagLink = (db: Database) => async (
  modelId: number,
  modelTagsId: number,
) => {
  try {
    const query = 'DELETE FROM model_tags_link WHERE model_id = $1 AND model_tags_id = $2'

    await db.query(query, [modelId, modelTagsId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getAllModelsBySearch = (db: Database) => async (
  filter: string,
  skip: number,
  limit: number,
) => {
  try {
    let query = `
      SELECT models.name as name, models.id, models.annotation FROM models
      LEFT JOIN model_tags_link ON models.id = model_tags_link.model_id
      LEFT JOIN model_tags ON model_tags_link.model_tags_id = model_tags.id
      WHERE annotation LIKE $1
      OR models.name LIKE $1
      OR EXISTS(
        SELECT name FROM model_tags
        JOIN model_tags_link ON model_tags_link.model_tags_id = model_tags.id
        WHERE model_tags_link.model_id = models.id
        AND model_tags.name LIKE $1
      )
      GROUP BY models.id
      ORDER BY models.id`

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    if (skip) {
      query += ` OFFSET ${skip}`
    }

    const res = await db.query(query, [`%${filter}%`])
    return res ? res.rows : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAllModelsBySearchCount = (db: Database) => async (
  filter: string,
): Promise<number | null> => {
  try {
    const query = `
      SELECT count(*) FROM models
      LEFT JOIN model_tags_link ON models.id = model_tags_link.model_id
      LEFT JOIN model_tags ON model_tags_link.model_tags_id = model_tags.id
      WHERE annotation LIKE $1
      OR models.name LIKE $1
      OR EXISTS(
        SELECT name FROM model_tags
        JOIN model_tags_link ON model_tags_link.model_tags_id = model_tags.id
        WHERE model_tags_link.model_id = models.id
        AND model_tags.name LIKE $1
      )
      GROUP BY models.id
      ORDER BY models.id`

    const res = await db.query(query, [`%${filter}%`])
    return res ? Rpath(['rows', 0, 'count'], res) as number : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const deleteSelectedLabels = (db: Database) => async (
  modelId: number,
) => {
  try {
    const query = 'DELETE FROM selected_labels WHERE model_id = $1'

    await db.query(query, [modelId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export type NeuralNetworkStoreType = {
  getAllModelsBySearchCount: ReturnType<typeof getAllModelsBySearchCount>,
  getAllModelsCount: ReturnType<typeof getAllModelsCount>,
  deleteSelectedLabels: ReturnType<typeof deleteSelectedLabels>,
  getAllModelsBySearch: ReturnType<typeof getAllModelsBySearch>,
  deleteModelTagLink: ReturnType<typeof deleteModelTagLink>,
  getTagsForModel: ReturnType<typeof getTagsForModel>,
  insertModelTagLink: ReturnType<typeof insertModelTagLink>,
  getModelTags: ReturnType<typeof getModelTags>,
  insertModelTag: ReturnType<typeof insertModelTag>,
  updateAnnotation: ReturnType<typeof updateAnnotation>,
  insertModel: ReturnType<typeof insertModel>,
  deleteModelById: ReturnType<typeof deleteModelById>,
  getModelById: ReturnType<typeof getModelById>,
  getAllModels: ReturnType<typeof getAllModels>,
  getModels: ReturnType<typeof getModels>,
  getNeuralNetworks: ReturnType<typeof getNeuralNetworks>,
}

const NeuralNetworkStore = ({ db }: { db: Database }): NeuralNetworkStoreType => ({
  getAllModelsBySearchCount: getAllModelsBySearchCount(db),
  getAllModelsCount: getAllModelsCount(db),
  deleteSelectedLabels: deleteSelectedLabels(db),
  getAllModelsBySearch: getAllModelsBySearch(db),
  deleteModelTagLink: deleteModelTagLink(db),
  getTagsForModel: getTagsForModel(db),
  insertModelTagLink: insertModelTagLink(db),
  getModelTags: getModelTags(db),
  insertModelTag: insertModelTag(db),
  updateAnnotation: updateAnnotation(db),
  insertModel: insertModel(db),
  deleteModelById: deleteModelById(db),
  getModelById: getModelById(db),
  getAllModels: getAllModels(db),
  getModels: getModels(db),
  getNeuralNetworks: getNeuralNetworks(db),
})

export default NeuralNetworkStore
