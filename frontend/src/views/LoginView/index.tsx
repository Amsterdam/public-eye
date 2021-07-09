import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useThunkDispatch } from 'store'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import login from 'thunks/auth/login'
import getUserRoles from 'thunks/auth/getUserRoles'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    border: '0.5px solid grey',
    borderRadius: 7,
  },
  textField: {
    width: 300,
    margin: theme.spacing(2),
  },
  button: {
    width: 300,
    margin: theme.spacing(2),
  },
}))

const LoginView = () => {
  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const commitLogin = async () => {
    const token = await dispatch(login(email, password))
    if (token) {
      dispatch(getUserRoles(token))

      history.push('/')
    } else {
      alert('Email and password combination is incorrect.')
    }
  }

  const changeEmail = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)
  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)

  return (
    <div className={classes.root}>
      <form className={classes.form} noValidate autoComplete="off">
        <TextField
          onChange={changeEmail}
          className={classes.textField}
          label="Email"
          variant="outlined"
        />
        <TextField
          onChange={changePassword}
          className={classes.textField}
          type="password"
          label="Password"
          variant="outlined"
        />
        <Button
          disabled={email === '' || password === ''}
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={commitLogin}
          autoFocus
        >
          Login
        </Button>
      </form>
    </div>
  )
}

export default LoginView
