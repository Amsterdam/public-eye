import React from 'react'
import SideBar from 'common/SideBar'
import NavigatorHeader from '../../Navigator/NavigatorHeader'
import DatasetList from './DatasetList'

const DatasetNavigator = (): React.ReactElement => (
  <SideBar>
    <NavigatorHeader />
    <DatasetList />
  </SideBar>
)

export default DatasetNavigator
