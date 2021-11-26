// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react'
import * as R from 'ramda'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Chip from '@material-ui/core/Chip'
import newUserRole from 'thunks/users/newUserRole'
import deleteUserRole from 'thunks/users/deleteUserRole'
import { UserRole } from 'types'
import { useThunkDispatch } from 'store'

const useStyles = makeStyles(() => ({
  root: {
    width: 400,
  },
}))

type RolesSelectorProps = {
  userId: number,
  initialState: [],
  roles: []
}

const RolesSelector = (props: RolesSelectorProps): React.ReactNode => {
  const {
    roles,
    initialState,
    userId,
  } = props

  const classes = useStyles()
  const dispatch = useThunkDispatch()
  const [state, setState] = useState([])

  useEffect(() => {
    setState(initialState)
  }, [initialState])

  const handleChange = useCallback(async (e, _, actionType, { option }: { option: UserRole }) => {
    if (actionType === 'select-option') {
      dispatch(newUserRole(userId, option.id))
        .then((success: boolean) => {
          if (success) {
            setState((oldState) => R.append(option)(oldState))
          }
        })
    }
    if (actionType === 'remove-option') {
      dispatch(deleteUserRole(userId, option.id))
        .then((success: boolean) => {
          if (success) {
            setState((oldState) => R.filter(({ id }) => id !== option.id)(oldState))
          }
        })
    }
  }, [dispatch, userId])

  return (
    <Autocomplete
      multiple
      className={classes.root}
      options={roles}
      getOptionLabel={(role) => role.name}
      value={state}
      onChange={handleChange}
      // custom equality check because elements are objects
      getOptionSelected={(option) => R.includes(option)(state)}
      filterSelectedOptions
      disableClearable
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
        />
      )}
      renderTags={(value, getTagProps) => R.pipe(
        // perhaps should be sorted based on authority of role
        R.mapObjIndexed((option: UserRole, index) => (
          <Chip
            size="small"
            key={option.id}
            variant="outlined"
            label={option.name}
            {...getTagProps({ index })}
          />
        )),
        R.values,
      )(value)}
    />
  )
}

export default RolesSelector
