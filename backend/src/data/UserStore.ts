import bcrypt from 'bcrypt'
import { Database } from 'db'
import {
  UserRole,
  User,
} from 'typescript-types'

const getUserById = (db: Database) => async (
  id: number,
): Promise<User | null> => {
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

    return res ? res.rows[0] as User : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const getUserByEmail = (
  db: Database,
) => async (email: string): Promise<User | null> => {
  try {
    const query = 'SELECT id, email FROM users WHERE email = $1'

    const res = await db.query(query, [email])

    return res ? res.rows[0] as User : null
  } catch (e) {
    console.error(e)
    return null
  }
}

const validatePasswordForEmail = (db: Database) => async (
  email: string,
  passwordPlaintext: string,
): Promise<boolean> => {
  try {
    const query = 'SELECT password FROM users WHERE email = $1'

    const res = await db.queryOne<{ password: string }>(query, [email], null)

    if (res == null) {
      return false
    }

    return await bcrypt.compare(
      passwordPlaintext,
      res.password,
    )
  } catch (e) {
    console.error(e)
    return false
  }
}

const validatePasswordForId = (
  db: Database,
) => async (
  id: number,
  passwordPlaintext: string,
) => {
  try {
    const query = 'SELECT password FROM users WHERE id = $1'

    const res = await db.queryOne<{ password: string }>(query, [id], null)

    if (res == null) {
      return false
    }

    return await bcrypt.compare(passwordPlaintext, res.password)
  } catch (e) {
    console.error(e)
    return false
  }
}

const newUser = (db: Database) => async (
  email: string,
  saltRounds: string | number,
  plainTextPassword: string,
): Promise<User | null> => {
  try {
    const hash = bcrypt.hashSync(plainTextPassword, saltRounds)
    const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email'

    const res = await db.query(query, [email, hash])
    return res ? res.rows[0] as User : null
  } catch (e) {
    return null
  }
}

const getAllUsers = (db: Database) => async () => {
  try {
    const query = `
      SELECT users.id as id, email,
        array_agg(json_strip_nulls(json_build_object('name', name, 'id', roles.id)))
        as roles FROM users
      LEFT JOIN user_roles ON user_roles.user_id = users.id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      GROUP BY users.id`

    const res = await db.query(query)
    return res ? res.rows : null
  } catch (e) {
    console.log(e)
    return false
  }
}

const deleteUser = (db: Database) => async (id: number) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1'

    await db.query(query, [id])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const editEmail = (db: Database) => async (
  id: number,
  email: string,
) => {
  try {
    const query = 'UPDATE users SET email = $1 WHERE id = $2'

    await db.query(query, [email, id])
    return true
  } catch (e) {
    return false
  }
}

const changePassword = (db: Database) => async (
  id: number,
  plainTextPassword: string,
  saltRounds: string | number,
) => {
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

const getAllRoles = (db: Database) => async () => {
  try {
    const query = 'SELECT * FROM roles'

    const res = await db.query(query)

    return res ? res.rows : null
  } catch (e) {
    return null
  }
}

const insertUserRole = (db: Database) => async (
  userId: number,
  roleId: number,
) => {
  try {
    const query = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)'

    await db.query(query, [userId, roleId])
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

const deleteUserRole = (db: Database) => async (
  userId: number,
  roleId: number,
) => {
  try {
    const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2'

    await db.query(query, [userId, roleId])
    return true
  } catch (e) {
    return false
  }
}

const deleteUserRolesByUserId = (db: Database) => async (
  userId: number,
) => {
  try {
    const query = 'DELETE FROM user_roles WHERE user_id = $1'

    await db.query(query, [userId])
    return true
  } catch (e) {
    return false
  }
}

const getRolesByUserId = (db: Database) => async (
  userId: number,
): Promise<UserRole[] | null> => {
  try {
    const query = 'SELECT name FROM roles JOIN user_roles ON user_roles.role_id = roles.id WHERE user_roles.user_id = $1'

    const res = await db.query<UserRole>(query, [userId])
    return res ? res.rows : null
  } catch (e) {
    return null
  }
}

export type UserStoreType = {
  validatePasswordForId: ReturnType<typeof validatePasswordForId>,
  deleteUserRolesByUserId: ReturnType<typeof deleteUserRolesByUserId>,
  getRolesByUserId: ReturnType<typeof getRolesByUserId>,
  deleteUserRole: ReturnType<typeof deleteUserRole>,
  insertUserRole: ReturnType<typeof insertUserRole>,
  getAllRoles: ReturnType<typeof getAllRoles>,
  changePassword: ReturnType<typeof changePassword>,
  editEmail: ReturnType<typeof editEmail>,
  deleteUser: ReturnType<typeof deleteUser>,
  getUserById: ReturnType<typeof getUserById>,
  getUserByEmail: ReturnType<typeof getUserByEmail>,
  validatePasswordForEmail: ReturnType<typeof validatePasswordForEmail>,
  newUser: ReturnType<typeof newUser>,
  getAllUsers: ReturnType<typeof getAllUsers>,
}

const UserStore = ({ db }: { db: Database }): UserStoreType => ({
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

export default UserStore
