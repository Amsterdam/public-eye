import bcrypt from 'bcrypt'
import config from 'common/config'
import db from 'db'
import readline from 'readline'
import { path } from 'ramda'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log('Setting up admin acount')

let inputEmail: string | null = null
let inputPassword: string | null = null

rl.question('Please input email: ', (email) => {
  inputEmail = email
  rl.question('Please input password: ', (password) => {
    inputPassword = password
    rl.close()
  })
})

const onClose = async () => {
  await db.connect(config.postgres)

  const hash = bcrypt.hashSync(
    inputPassword as string,
    config.passwordSaltRounds,
  )
  const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id'
  const res = await db.query(query, [inputEmail, hash])
  const userId = path([0, 'id'], res)
  const roleRes = await db.query(`
    SELECT id FROM roles WHERE name = 'admin'
  `)

  const roleId = path([0, 'id'], roleRes)
  const userRoleQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)'

  await db.query(userRoleQuery, [userId, roleId])
  console.log('Admin created')
  return process.exit(0)
}

rl.on('close', () => {
  onClose()
})
