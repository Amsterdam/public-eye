import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import { Route } from 'react-router'
import { MockStoreEnhanced } from 'redux-mock-store'
import { act } from 'react-dom/test-utils'
import { Frame } from 'types'
import mockStore from 'testing/mock-store'
import { Provider } from 'react-redux'
import FrameEntry from '.'

const ITEM_ID = 1
const PAGE = 10
const FRAME: Frame = {
  path: '/some-path.jpeg',
  locked: false,
  id: 10,
}

describe('FrameEntry component', () => {
  let container: HTMLDivElement | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: MockStoreEnhanced<unknown, any>

  beforeEach(() => {
    store = mockStore({})
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container) {
      unmountComponentAtNode(container)
      container.remove()
    }

    container = null
  })

  it('Correctly navigates when frame is clicked maintaining the page.', () => {
    const history = createMemoryHistory({
      initialEntries: [
        `/ingest/videos/${ITEM_ID}/frames?page=${PAGE}`,
      ],
    })

    act(() => {
      render(
        <Router history={history}>
          <Provider store={store}>
            <Route
              path="/ingest/videos/:id/frames/:frameId?"
            >
              <FrameEntry
                index={10}
                frame={FRAME}
                locked={FRAME.locked}
                checked={false}
                itemId={ITEM_ID}
                itemType="video"
                setCheckedItems={jest.fn}
              />
            </Route>
          </Provider>
        </Router>,
        container,
      )
    })

    const frameEntry = document.querySelector('[data-testid=frame-entry]')

    act(() => {
      if (frameEntry) {
        frameEntry.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    })

    expect(history.location.pathname)
      .toBe(`/ingest/videos/${ITEM_ID}/frames/${String(FRAME.id)}`)

    expect(history.location.search).toBe(`?page=${PAGE}`)
  })
})
