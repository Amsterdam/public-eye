import React from 'react'
import ReactMarkdown from 'react-markdown/with-html'
import gfm from 'remark-gfm'
import { Box } from '@material-ui/core'

const useMarkdownContent = (file: string) => {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    let mounted = true
    fetch(file)
      .then((response) => response.text())
      .then((text) => {
        if (mounted) {
          setContent(text)
        }
      })

    return () => { mounted = false }
  }, [file])

  return content
}

const InfoMarkdown = ({
  file,
}: {
  file: string,
}): React.ReactElement => {
  const content = useMarkdownContent(file)

  return (
    <Box padding={2}>
      <ReactMarkdown plugins={[gfm]} allowDangerousHtml>
        {content}
      </ReactMarkdown>
    </Box>
  )
}

export default InfoMarkdown
