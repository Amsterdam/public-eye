import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Pagination from '@material-ui/lab/Pagination'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: '1px solid',
    padding: theme.spacing(1),
  },
}))

export const NUMBER_OF_PAGINATION_ITEMS = 25

const PaginationComponent = ({
  numberOfItems,
  changePage,
  page,
}: {
  numberOfItems: number,
  changePage: (value: number) => void,
  page: number,
}): JSX.Element => {
  const classes = useStyles()

  const handleChange = React.useCallback((event, value) => {
    changePage(value)
  }, [changePage])

  const paginationCount = React.useMemo(() => (
    Math.ceil(numberOfItems / NUMBER_OF_PAGINATION_ITEMS)
  ), [numberOfItems])

  return (
    <div className={classes.root}>
      <Pagination
        page={page}
        count={paginationCount}
        onChange={handleChange}
      />
    </div>
  )
}

export default PaginationComponent
