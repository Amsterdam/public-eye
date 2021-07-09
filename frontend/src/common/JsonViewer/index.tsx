import React, { memo } from 'react'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  card: {
    minWidth: 500,
    maxWidth: 500,
    height: 500,
    margin: theme.spacing(2),
  },
  cardContent: {
    height: 340,
    overflow: 'auto',
  },
}))

const JsonViewer = ({
  json,
  title,
}: {
  json: string,
  title: string,
}) => {
  const classes = useStyles()
  const content = json
    ? JSON.stringify(JSON.parse(json), null, 4)
    : ''

  return (
    <Card className={classes.card}>
      <CardHeader title={title} />
      <CardContent className={classes.cardContent}>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
        <SyntaxHighlighter language="json" style={a11yLight}>
          {content}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  )
}

export default memo(JsonViewer)
