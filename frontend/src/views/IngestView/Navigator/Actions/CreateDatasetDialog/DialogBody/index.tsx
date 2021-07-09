import React from 'react'
import DensityContent from './DensityContent'
import ObjectContent from './ObjectContent'
import LoiContent from './LoiContent'

type PropsType = {
  nnType: string,
  selectedFrameIds: number[],
  handleClose: () => null,
}

const DialogBody = (props: PropsType): React.ReactElement => {
  const {
    nnType,
    selectedFrameIds,
    handleClose,
  } = props

  switch (nnType) {
    case 'density_estimation':
      return (
        <DensityContent
          selectedFrameIds={selectedFrameIds}
          handleClose={handleClose}
        />
      )
    case 'object_recognition':
      return (
        <ObjectContent
          selectedFrameIds={selectedFrameIds}
          handleClose={handleClose}
        />
      )
    case 'loi':
      return (
        <LoiContent
          selectedFrameIds={selectedFrameIds}
          handleClose={handleClose}
        />
      )
    default:
      return (
        <DensityContent
          selectedFrameIds={selectedFrameIds}
          handleClose={handleClose}
        />
      )
  }
}

export default DialogBody
