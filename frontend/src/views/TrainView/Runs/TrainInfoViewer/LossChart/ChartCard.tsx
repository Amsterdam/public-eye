import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Chart from 'react-google-charts'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Card from '@material-ui/core/Card'
import {
  Row,
} from './utils'

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2),
    minWidth: 600,
    height: 500,
  },
}))

type ChartCardProps = {
  data: Row[],
  title: string
}

const ChartCard = ({ data, title }: ChartCardProps): React.ReactNode => {
  const classes = useStyles()

  return (
    <Card className={classes.root}>
      <CardHeader title={title || 'Training Trajectory'} />
      {
        data.length > 1
          ? (
            <CardContent>
              <Chart
                width="600px"
                height="400px"
                chartType="LineChart"
                loader={<div>Loading Chart</div>}
                data={data}
                options={{
                  hAxis: {
                    title: 'Epoch',
                  },

                }}
                rootProps={{ 'data-testid': '1' }}
              />
            </CardContent>
          ) : ''
      }
    </Card>
  )
}

export default ChartCard
