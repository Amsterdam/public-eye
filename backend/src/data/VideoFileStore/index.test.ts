import config from 'common/config'
import { useDatabase } from 'common/testing'
import VideoFileStore, { VideoFileStoreType } from '.'

const dependencies = useDatabase(config)

let videoFileStore: VideoFileStoreType

beforeAll(() => {
  videoFileStore = VideoFileStore({ db: dependencies.db })

  dependencies.db.query("INSERT INTO video_files (path) VALUES ('/random_path/file.video')")
  dependencies.db.query("INSERT INTO video_files (path) VALUES ('/random_path/file_with_filter.video')")
})

test('VideoFileStore gets the correct number of videos', async () => {
  const count = await videoFileStore.getTotalVideoCount('')

  expect(count).toEqual('2')
})

test('VideoFileStore gets the correct number of filtered videos', async () => {
  const count = await videoFileStore.getTotalVideoCount('filter')

  expect(count).toEqual('1')
})
