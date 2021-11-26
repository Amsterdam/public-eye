// @ts-nocheck
import React from 'react'
import List from '@material-ui/core/List'
import Item from './Item'

type ItemType = {
  onClick: () => void,
  name: JSX.Element,
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
}: JobsNavigatorProps): JSX.Element => {
  const makeItem = (item: ItemType, index: number) => (
    <Item
      key={index}
      isSelected={selectedIndex === item.index}
      onClick={item.onClick}
      name={item.name}
      status={item.status}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      reload={item.reload}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      clone={item.clone}
    />
  )

  return (
    <List>
      {
        items.map(makeItem)
      }
    </List>
  )
}

export default JobsNavigator
