import { path } from 'ramda'
import config from 'common/config'
import process from 'process'
import db from 'db'
import AuthService from 'services/AuthService'

const setUpEelibUser = async () => {
  try {
    await db.connect(config.postgres)
    const authService = AuthService({ ...config.api.jwt, authorization: {} }, db)

    const inputEmail = 'eelib@admin.user'

    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [inputEmail])
    let userId: number | undefined
    if (userRes && userRes.rows.length === 0) {
      const hash = '$2b$10$z7/.mNqo1NaaNGKaQlqL3e8vYUXmkNyemzxvXL1qaVelEifA1nK8m'
      const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id'

      console.log('Creating eelib user...')
      const res = await db.query(query, [inputEmail, hash])
      userId = path(['rows', 0, 'id'], res)
      const roleRes = await db.query('SELECT id FROM roles WHERE name = \'admin\'')

      const roleId = path(['rows', 0, 'id'], roleRes)
      const userRoleQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)'

      await db.query(userRoleQuery, [userId, roleId])
    } else {
      userId = path(['rows', 0, 'id'], userRes)
    }

    if (userId) {
      const token = await authService.createJwtForUser(userId)
      console.log(`JWT Token: "${token}"`)
    }
  } catch (e) {
    console.error(e)
  } finally {
    process.exit(0)
  }
}

setUpEelibUser()
