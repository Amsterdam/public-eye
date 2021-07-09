const bcrypt = require('bcrypt')

const getUserById = (db) => async (id) => {
  try {
    const query = `
      SELECT users.id as id, email,
        array_agg(json_strip_nulls(json_build_object('name', name, 'id', roles.id))) as roles
      FROM users
      LEFT JOIN user_roles ON user_roles.user_id = users.id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      WHERE users.id = $1
      GROUP BY users.id`

    const res = await db.query(query, [id])

    return res.rows[0] || {}
  } catch (e) {
    console.error(e)
    return {}
  }
}

const getUserByEmail = (db) => async (email) => {
  try {
    const query = 'SELECT id, email FROM users WHERE email = $1'

    const res = await db.query(query, [email])

    return res.rows[0] || {}
  } catch (e) {
    console.error(e)
    return {}
  }
}

const validatePasswordForEmail = (db) => async (email, passwordPlaintext) => {
  try {
    const query = 'SELECT password FROM users WHERE email = $1'

    const res = await db.queryOne(query, [email], null)

    if (res == null) {
        return false
    }

    return await bcrypt.compare(passwordPlaintext, res.password)
  } catch (e) {
    console.error(e)
    return false
  }
}

const validatePasswordForId = (db) => async (id, passwordPlaintext) => {
  try {
    const query = 'SELECT password FROM users WHERE id = $1'

    const res = await db.queryOne(query, [id], null)

    if (res == null) {
        return false
    }

    return await bcrypt.compare(passwordPlaintext, res.password)
  } catch (e) {
    console.error(e)
    return false
  }
}

const newUser = (db) => async (email, saltRounds, plainTextPassword) => {
  try {
    const hash = bcrypt.hashSync(plainTextPassword, saltRounds)
    const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email'

    const res = await db.query(query, [email, hash])
    return res.rows[0] || null
  } catch (e) {
    return false
  }
}

const getAllUsers = (db) => async () => {
  try {
    const query = `
      SELECT users.id as id, email,
        array_agg(json_strip_nulls(json_build_object('name', name, 'id', roles.id)))
        as roles FROM users
      LEFT JOIN user_roles ON user_roles.user_id = users.id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      GROUP BY users.id`

    const res = await db.query(query)
    return res.rows
  } catch (e) {
    console.log(e)
    return false
  }
}

const deleteUser = (db) => async (id) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const editEmail = (db) => async (id, email) => {
  try {
    const query = 'UPDATE users SET email = $1 WHERE id = $2'

    await db.query(query, [email, id])
    return true
  } catch (e) {
    return false
  }
}

const changePassword = (db) => async (id, plainTextPassword, saltRounds) => {
  try {
    const hash = bcrypt.hashSync(plainTextPassword, saltRounds)
    const changeQuery = 'UPDATE users SET password = $1 WHERE id = $2'

    await db.query(changeQuery, [hash, id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const getAllRoles = (db) => async () => {
  try {
    const query = 'SELECT * FROM roles'

    const res = await db.query(query)

    return res.rows || null
  } catch (e) {
    return null
  }
}

const insertUserRole = (db) => async (userId, roleId) => {
  try {
    const query = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)'

    await db.query(query, [userId, roleId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteUserRole = (db) => async (userId, roleId) => {
  try {
    const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2'

    await db.query(query, [userId, roleId])
    return true
  } catch (e) {
    return false
  }
}

const deleteUserRolesByUserId = (db) => async (userId) => {
  try {
    const query = 'DELETE FROM user_roles WHERE user_id = $1'

    await db.query(query, [userId])
    return true
  } catch (e) {
    return false
  }
}

const getRolesByUserId = (db) => async (userId) => {
  try {
    const query = 'SELECT name FROM roles JOIN user_roles ON user_roles.role_id = roles.id WHERE user_roles.user_id = $1'

    const res = await db.query(query, [userId])
    return res.rows || null
  } catch (e) {
    return false
  }
}


const UserStore = ({db}) => ({
  validatePasswordForId: validatePasswordForId(db),
  deleteUserRolesByUserId: deleteUserRolesByUserId(db),
  getRolesByUserId: getRolesByUserId(db),
  deleteUserRole: deleteUserRole(db),
  insertUserRole: insertUserRole(db),
  getAllRoles: getAllRoles(db),
  changePassword: changePassword(db),
  editEmail: editEmail(db),
  deleteUser: deleteUser(db),
  getUserById: getUserById(db),
  getUserByEmail: getUserByEmail(db),
  validatePasswordForEmail: validatePasswordForEmail(db),
  newUser: newUser(db),
  getAllUsers: getAllUsers(db),
})

module.exports = UserStore
