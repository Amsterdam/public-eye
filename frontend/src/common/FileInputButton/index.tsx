import React from 'react'
import Button from '@material-ui/core/Button'

type FileInputButtonProps = {
  submitFile: () => null,
  children: React.ReactNode,
}

const FileInputButton = ({ submitFile, children }: FileInputButtonProps): React.ReactElement => (
  <label htmlFor="file-upload">
    <Button variant="contained" color="primary" component="span">
      {children}
    </Button>
    <input
      onChange={submitFile}
      type="file"
      id="file-upload"
      style={{
        position: 'absolute',
        opacity: 0,
        width: 0,
      }}
    />
  </label>
)

export default FileInputButton
