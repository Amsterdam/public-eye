import { execSync } from 'child_process'
import { readdir } from 'fs/promises'
import { Pool, Client, QueryResult, PoolClient } from 'pg'
import { sortBy, split, head } from 'ramda'
import { PostgresConfig } from 'common/config/index'

export let pool: null | Pool | Client = null

const connect = async (config: PostgresConfig): Promise<void> => new Promise((resolve, reject) => {
  if (pool !== null) {
    return reject('Pool is already present')
  }
  try {
    pool = new Pool(config)

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })

    pool.connect()
      .then(() => {
        resolve()
      })
      .catch((e) => {
        reject(e)
      })
  } catch (e) {
    reject(e)
    pool = null
  }
})


const connectClient = async (config: PostgresConfig): Promise<void> => {
  try {
    pool = new Client(config)

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })

    await pool.connect()
  } catch (e) {
    console.error(e)
    pool = null
  }
}

const query = async <Type>(
  queryString: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<QueryResult<Type> | undefined> => {
  if (pool !== null) {
    const result = await pool.query(queryString, values)
    return result
  }

  return undefined
}

const queryOne = async <Type>(
  queryString: string,
  // eslint-disable-next-line
  value: any[],
  // eslint-disable-next-line
  defaultVal?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Type | undefined> => {
  const res = await query(queryString, value)

  if (res) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (res.rows.length > 0 ? res.rows[0] : defaultVal) || defaultVal
  }

  return undefined
}

const sortMigFiles = (files: string[]): string[] => {
  const sortFunction = (file: string) => Number(head(split('-', file)))

  return sortBy(sortFunction)(files)
}

const escapePass = (pw: string): string => pw.replace(/(["'$`\\])/g, '\\$1')

const initTestDatabase = async (
  config: PostgresConfig,
  schemaFile: string,
  migrationsFolder: string,
  seedFolder: string,
): Promise<void> => {
  const escapedPw = escapePass(config.password)
  const schemaCommand = `PGPASSWORD=${escapedPw} psql -U ${config.username} -h ${config.host} -d ${config.test_database} < ${schemaFile}`
  execSync(schemaCommand)

  const migFiles = await readdir(migrationsFolder).then(sortMigFiles)
  migFiles.forEach((migFile: string) => {
    const migCommand = `PGPASSWORD=${escapedPw} psql -U ${config.username} -h ${config.host} -d ${config.test_database} < ${migrationsFolder}/${migFile}`
    execSync(migCommand)
  })

  const seedFiles = await readdir(seedFolder).then(sortMigFiles)
  seedFiles.forEach((migFile: string) => {
    const seedCommand = `PGPASSWORD=${escapedPw} psql -U ${config.username} -h ${config.host} -d ${config.test_database} < ${seedFolder}/${migFile}`
    execSync(seedCommand)
  })
}

// drops all tables in the db that is currently connected
// so use carefully ;)
const destroyDatabase = async (): Promise<void> => {
  if (pool !== null) {
    // eslint-disable-next-line @typescript-eslint/quotes
    const queries = await pool.query(`select 'drop table "' || tablename || '" cascade;' from pg_tables  where schemaname = 'public';`)

    await Promise.all(queries.rows.map((dropQuery) => {
      if (pool !== null) {
        // eslint-disable-next-line
        return pool.query(dropQuery['?column?']).catch(console.error)
      }
      return null
    }))
  }
}

const close = async () => {
  if (pool !== null) {
    return await pool.end()
  }
}

const getPool = () => {
  return pool
}

const db = {
  close,
  connect,
  connectClient,
  query,
  queryOne,
  initTestDatabase,
  destroyDatabase,
  getPool,
}

export type Database = typeof db
export default db
