/* eslint-disable */
import React, { Attributes, ComponentClass, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Route,
  Redirect,
  useRouteMatch,
  useLocation,
  useParams,
} from 'react-router-dom'
import {
  pathOr,
  split,
  last,
} from 'ramda'
import { RootState } from 'reducers'
import { Camera } from 'types'
import { RouteComponentProps } from 'react-router'

export const usePage = () => {
  const params = new URLSearchParams(useLocation().search)

  return Number(params.get('page') || 1)
}

export const useFilter = () => {
  const params = new URLSearchParams(useLocation().search)

  return params.get('filter')
}

export const useFrameView = (): boolean => {
  const location = useLocation()

  const frameView = React.useMemo(() => (
    location.pathname.split('/').includes('frames')
  ), [location])

  return frameView
}

export const extractDeployName = (json: string): string => {
  const {
    name,
  } = JSON.parse(json) as { name: string }

  return name
}

export const useIngestPath = () => {
  const location = useLocation()
  const { id, frameId } = useParams<{ id: string | undefined, frameId: string | undefined }>()
  const [type, setType] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    const splitted = location.pathname.split('/')

    if (splitted.length > 2) {
      setType(splitted[2])
    }
  }, [location.pathname])

  return {
    type,
    id,
    frameId,
  }
}

type UseMeasure = [
  (node: HTMLDivElement | null) => void,
  { left: number, top: number, width: number, height: number },
  () => void,
]

export const useMeasure = (): UseMeasure => {
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null)

  const onRefChange = React.useCallback((node: HTMLDivElement | null) => {
    setRef(node)
  }, [])

  const [left, setLeft] = React.useState(0)
  const [top, setTop] = React.useState(0)
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)

  const resize = React.useCallback(() => {
    if (ref !== null) {
      const {
        left: newLeft,
        top: newTop,
        width: newWidth,
        height: newHeight,
      } = ref.getBoundingClientRect()

      setLeft(newLeft)
      setTop(newTop)
      setWidth(newWidth)
      setHeight(newHeight)
    }
  }, [ref])

  React.useEffect(() => {
    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [resize])

  return [
    onRefChange,
    {
      top,
      left,
      width,
      height,
    },
    // images change dimension when they are loaded
    // therefore this callback needs to be provided 
    // as the onLoad prop for an <img
    resize,
  ]
}

export const useSelectedId = (routes: string[]): string | null => {
  const [id, setId] = useState<string | null>(null)

  const match = useRouteMatch(routes)
  useEffect(() => {
    const newId = pathOr(null, ['params', 'id'])(match)
    setId(newId)
  }, [match])

  return id
}

export const useCamera = (cameraId: string): Camera | undefined => {
  const camera = useSelector((state: RootState) => {
    return state.cameras.get(Number(cameraId))
  })

  return camera
}

export const useMountEffect = (fun: () => void): void => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fun, [])
}

export const setToken = (token: string): void => {
  localStorage.setItem('eagle_eye_token', token)
}

export const getToken = (): string => localStorage.getItem('eagle_eye_token') || ''

export const getFileName = (path: string): string | undefined => {
  const splitted = split('/')(path)
  return last(splitted)
}

// type privateRouteType = {
//   component: React.ComponentType,
//   rest: Object,
// }

// export const PrivateRoute = ({ component: Component, ...rest }: privateRouteType) => (
//   <Route
//     {...rest}
//     render={(props: { location: string }) => (
//       getToken()
//         ? <Component {...props} />
//         : (
//           <Redirect
//             to={{
//               pathname: '/login',
//               state: { from: props.location },
//             }}
//           />
//         )
//     )}
//   />
// )

type PrivateRouteProps = {
  path: string,
  exact?: boolean,
  component: (
    React.FunctionComponent |
    React.FunctionComponent<{ match: { url: string }}>
  ),
}

export const PrivateRoute = ({ component, ...rest }: PrivateRouteProps): JSX.Element => {
  const routeComponent = (props: RouteComponentProps) => (
    getToken()
      ? React.createElement(component as React.FunctionComponent, props as Attributes)
      : <Redirect to={{ pathname: '/login' }} />
  )
  return <Route {...rest} render={routeComponent} />
}

export const stringIntegerArithmetic = (
  value: string | number,
  func: (value: string | number) => string,
): string | number => {
  try {
    return String(func(Number(value)))
  } catch (e) {
    return value
  }
}

export class StatusError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.message = message
    this.status = status
  }

  formattedString = (): string => `Status: ${this.status} - ${this.message}`

  static isStatusError(e: Error): boolean {
    return (e instanceof StatusError)
  }
}

export const fetchAndDiscard = async (
  url: string,
  ops: Record<string, unknown>,
): Promise<boolean> => {
  const r = await fetch(url, ops)

  if (r.ok) {
    return true
  }
  try {
    const j: Record<string, unknown> = await r.json()
    throw new StatusError(
      r.status,
      j.message ? `${j.status_label} - '${j.message}'` : 'Something went wrong on the server.',
    )
  } catch (e) {
    throw new StatusError(r.status, `Error calling '${url}'`)
  }
}

export const fetchJson = async (
  url: string,
  ops?: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const r = await fetch(url, ops)

  try {
    const j = await r.json()
    if (r.ok) {
      return j
    }
    throw new StatusError(
      r.status,
      j.message
        ? `${j.status_label} - '${j.message}'`
        : `Error calling '${url}'.`,
    )
  } catch {
    // try again to parse body as json
    try {
      const j = await r.json()
      throw new StatusError(
        r.status,
        j.message
          ? `${j.status_label} - '${j.message}'`
          : `Error calling '${url}'.`,
      )
    } catch (e) {
      // backoff to generic error
      throw new StatusError(r.status, `Error calling '${url}'.`)
    }
  }
}

export default {
  useSelectedId,
  fetchJson,
  fetchAndDiscard,
  stringIntegerArithmetic,
  getFileName,
  useMountEffect,
  setToken,
  getToken,
  PrivateRoute,
}
