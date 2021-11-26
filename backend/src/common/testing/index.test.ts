import config from 'common/config'
import { useDatabase } from '.'

const dependencies = useDatabase(config)

test('Test database name should be set in config', () => {
  expect(config.postgres.test_database).toBeDefined();
})

test('Can connect to test database', async () => {
  expect(dependencies.db.getPool()).not.toBeNull()
})
