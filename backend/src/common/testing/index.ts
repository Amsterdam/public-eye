import { Config } from 'common/config'
import loadApp from '../dependencies/load_app'


export const useDatabase = (config: Config) => {
  const { dependencies } = loadApp()

  beforeAll(async () => {
    try {
      await dependencies.db.connectClient({
        ...config.postgres,
        database: config.postgres.test_database,
      })
      await dependencies.db.initTestDatabase(
        config.postgres,
        `${String(process.env.EAGLE_EYE_PATH)}/install/0-postgres_init.sql`,
        `${String(process.env.EAGLE_EYE_PATH)}/install/migrations`,
        `${String(process.env.EAGLE_EYE_PATH)}/install/test_seeds`
      )
    } catch (e) {
      console.error('error when setting up', e)
    }
  })

  afterAll((done) => {
    dependencies.db.destroyDatabase()
      .then(() => dependencies.db.close())
      .catch((e) => console.error('error when destroying', e))
      .finally(done)
  })

  return dependencies
}

export default {
  useDatabase
}
