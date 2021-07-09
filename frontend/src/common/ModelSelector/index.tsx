import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react'
import {
  findIndex,
  contains,
  map,
  fromPairs,
  pipe,
  sortBy,
} from 'ramda'
import { useThunkDispatch } from 'store'
import getModels from 'thunks/training/getModels'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { NeuralNetwork, Model } from 'types'

type ModelSelectorProps = {
  network: NeuralNetwork | string,
  onChange: () => null,
  value: Model,
}

const getMae = (scores: Record<string, number>[]): number | null => {
  const index = findIndex((score) => !!score.mae)(scores)

  if (index !== -1) {
    return scores[index].mae
  }

  return null
}

const sortByMae = sortBy((model: Model) => getMae(model.scores))

const ModelSelector = (props: ModelSelectorProps) => {
  const {
    network,
    onChange,
    value,
  } = props

  const ref = useRef()
  const dispatch = useThunkDispatch()
  const [models, setModels] = useState([])
  const [textValue, setTextValue] = useState(null)

  const idToOption: Record<number, Model> = useMemo(() => pipe(
    map((model: Model) => [model.id, model]),
    fromPairs,
  )(models), [models])

  const getOptionLabel = useMemo(() => (id: number) => {
    if (!idToOption[id]) {
      return ''
    }
    const mae = getMae(idToOption[id].scores)
    return `${idToOption[id].name}${mae ? ` - MAE: ${mae}` : ''}`
  }, [idToOption])

  const modelIds = useMemo(() => pipe(
    sortByMae,
    map((model: Model) => model.id),
  )(models), [models])

  useEffect(() => {
    let mounted = true

    setModels([])
    if (network !== '') {
      dispatch(getModels(network))
        .then((result) => {
          if (result && mounted) {
            setModels(result)
          }
        })
    }
    return () => { mounted = false }
  }, [network, dispatch])

  const handleChange = useCallback((
    e, state, actionType, optionContainer: { option: string | null },
  ) => {
    if (optionContainer && optionContainer.option) {
      onChange(optionContainer.option)
      setTextValue(null)
    }
  }, [onChange])

  const filterOptionsFunc = useCallback((options: number[]) => {
    const filterFunc = (option: number) => {
      if (textValue === null || textValue === '') {
        return true
      }

      const model = idToOption[option]

      if (!model) {
        return false
      }

      if (textValue !== null && model.name.includes(textValue)) {
        return true
      }

      if (model.tags.some((tag) => contains(textValue)(tag))) {
        return true
      }

      return false
    }

    return options.filter(filterFunc)
  }, [idToOption, textValue])

  const onInputChange = useCallback((e, inputValue) => {
    if (inputValue === null) {
      return
    }

    if (typeof inputValue === 'string') {
      setTextValue(inputValue)
    }
  }, [])

  const getOptionSelected = (option, optionValue) => option === optionValue

  const inputValue = useMemo(() => {
    if (textValue !== null) {
      return textValue
    }
    if (value && idToOption[value.id]) {
      return idToOption[value.id].name
    }
    return ''
  }, [textValue, idToOption, value])

  return (
    <Autocomplete
      ref={ref}
      freeSolo
      value={value}
      inputValue={inputValue}
      getOptionSelected={getOptionSelected}
      filterOptions={filterOptionsFunc}
      onChange={handleChange}
      onInputChange={onInputChange}
      options={modelIds}
      getOptionLabel={getOptionLabel}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Pretrained model"
          variant="outlined"
        />
      )}
    />
  )
}

export default ModelSelector
