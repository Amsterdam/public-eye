const bcrypt = require('bcrypt')

const config = require('../common/config')
const db = require('../db')

const readline = require("readline")
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log('Setting up admin acount')

let inputEmail = null
let inputPassword = null

rl.question('Please input email: ', (email) => {
  inputEmail = email
  rl.question('Please input password: ', (password) => {
    inputPassword = password
    rl.close()

  })
})

rl.on("close", async () => {
  await db.connect(config.postgres)
  const hash = bcrypt.hashSync(inputPassword, config.passwordSaltRounds)
  const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id'
  const res = await db.query(query, [inputEmail, hash])
  const userId = res.rows[0].id
  const roleRes = await db.query("SELECT id FROM roles WHERE name = 'admin'")

  const roleId = roleRes.rows[0].id
  const userRoleQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)'

  await db.query(userRoleQuery, [userId, roleId])
  console.log('Admin created')
  process.exit(0)
})

