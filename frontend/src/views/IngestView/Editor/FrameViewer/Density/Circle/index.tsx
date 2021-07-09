import React, { useCallback } from 'react'
import { useDrag } from 'react-dnd'
import { makeStyles } from '@material-ui/core/styles'
import { StoreContext } from '../context'

const useStyles = makeStyles(({
  circle: (props: { circleRadius: number }) => ({
    width: 0,
    height: 0,
    padding: props.circleRadius,
    borderRadius: 13,
    cursor: 'pointer',
  }),
  regularCircle: {
    backgroundColor: '#ff2ac0e8',
  },
  selectedCircle: {
    backgroundColor: '#09FBD3',
  },
  identifier: {
    backgroundColor: 'black',
    color: 'yellow',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    fontSize: '0.7rem',
    height: 10,
  },
  hidden: {
    display: 'hidden',
    height: 10,
    marginBottom: 5,
  },
}))

export const ITEM_TYPE_CIRCLE = 'CIRCLE'

const Circle = ({
  circleRadius,
  index,
  x,
  y,
  id,
  zoom = false,
  locked = false,
}: {
  circleRadius: number,
  index: number,
  id: number,
  x: number,
  y: number,
  zoom: boolean,
  locked: boolean,
}) => {
  const classes = useStyles({ circleRadius })
  const {
    identifiers: [hideIdentifiers],
    selectedTagId: [selectedTagId, setSelectedTagId],
  } = React.useContext(StoreContext)

  const [{ isDragging }, drag] = useDrag({
    item: {
      index, x, y, type: ITEM_TYPE_CIRCLE, zoom,
    },
    canDrag: !locked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const adjust = React.useMemo(() => (
    !hideIdentifiers ? 15 : 0
  ), [hideIdentifiers])

  const onClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setSelectedTagId(id)
  }, [setSelectedTagId, id])

  if (isDragging) {
    return <div ref={drag} />
  }

  const colorClassName = id === selectedTagId
    ? classes.selectedCircle
    : classes.regularCircle

  return (
    <div
      key={index}
      style={{
        position: 'absolute',
        top: y - (circleRadius) - adjust,
        left: x - (circleRadius),
      }}
      onClick={onClick}
    >
      {
        !hideIdentifiers
        && (
          <div
            className={
              `${hideIdentifiers ? classes.hidden : classes.identifier} ${colorClassName}`
            }
          >
            {!hideIdentifiers && index}
          </div>
        )
      }
      <div ref={drag} className={`${classes.circle} ${colorClassName}`} />
    </div>
  )
}

export default Circle
