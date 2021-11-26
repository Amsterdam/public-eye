import { path } from 'ramda'
import config from 'common/config'
import { useDatabase } from 'common/testing'
import DatasetStore, { DatasetStoreType } from '.'

const dependencies = useDatabase(config)

let datasetStore: DatasetStoreType

beforeAll(async () => {
  datasetStore = DatasetStore({ db: dependencies.db })

  const res = await dependencies.db.query("INSERT INTO neural_network_type (name) VALUES ('nn_type_for_dataset') RETURNING id")
  const id = path(['rows', 0, 'id'], res)

  dependencies.db.query(`
    INSERT INTO datasets
      (name, nn_type_id)
    VALUES
      ('dataset1', $1)
  `, [id])
  dependencies.db.query(`
    INSERT INTO datasets
      (name, nn_type_id)
    VALUES
      ('dataset2.filter', $1)
  `, [id])
})

test('Dataset store gets correct total dataset count', async () => {
  const count = await datasetStore.getTotalDatasetsCount()

  expect(count).toEqual('2')
})

test('Dataset store gets correct total dataset count with filter', async () => {
  const count = await datasetStore.getTotalDatasetsCount("filter")

  expect(count).toEqual('1')
})

