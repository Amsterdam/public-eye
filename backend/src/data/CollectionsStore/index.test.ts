import config from 'common/config'
import { useDatabase } from 'common/testing'
import CollectionsStore, { CollectionStoreType } from '.'

const dependencies = useDatabase(config)

let collectionStore: CollectionStoreType

beforeAll(() => {
  collectionStore = CollectionsStore({ db: dependencies.db })

  dependencies.db.query("INSERT INTO collections (name) VALUES ('col1')" )
  dependencies.db.query("INSERT INTO collections (name) VALUES ('col2.with.filter')")
})

test('Collections count returns correct number of collections', async () => {
  const count = await collectionStore.getTotalCollectionCount('')

  expect(count).toEqual('2')
})

test('Filtered collections count returns correct number of collections', async () => {
  const count = await collectionStore.getTotalCollectionCount('filter')

  expect(count).toEqual('1')
})

test('Get collection returns correct collections', async () => {
  const collections = await collectionStore.getAllCollections(0, 25, undefined)

  const collectionsShouldBe = [
    {
      id: 1,
      name: 'col1',
      collection_id: null,
      frame_count: null,
      frame_locked_count: null,
    },
    {
      id: 2,
      name: 'col2.with.filter',
      collection_id: null,
      frame_count: null,
      frame_locked_count: null,
    },
  ]

  expect(collections).toEqual(collectionsShouldBe)
})
