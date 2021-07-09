import React from 'react'
import List from '@material-ui/core/List'
import Item from './Item'

type ItemType = {
  onClick: () => void,
  name: React.ReactElement,
  status: 'running' | 'error' | 'done' | 'scheduled',
  index: number,
}

type JobsNavigatorProps = {
  items: ItemType[],
  selectedIndex: number | null,
}

const JobsNavigator = ({
  items,
  selectedIndex = null,
}: JobsNavigatorProps) => {
  const makeItem = (item: ItemType, index: number): React.ReactElement => (
    <Item {...item} key={index} isSelected={selectedIndex === item.index} />
  )

  return (
    <List>
      { items.map(makeItem) }
    </List>
  )
}

export default JobsNavigator
