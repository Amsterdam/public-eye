import JobStore from 'data/JobStore'
import process from 'process'
import fs from 'fs'
import {
  spawn,
  exec,
  execSync,
} from 'child_process'
import os from 'os'
import { SchedulerConfig } from 'common/config'
import { Job } from 'typescript-types'
import { Server } from 'socket.io'
import { Database } from 'db'

interface SchedulerServiceConfig extends SchedulerConfig {
  db: Database,
  io: Server,
}

const STDERR_PREFIX = '&$'
const STDOUT_PREFIX = '$&'

const handleOutputLine = (prefix: string, data: string) => (
  `${`${prefix}${data}`.replace(/\n/g, '\\n')}\n`)

const killAndStopWin32 = (pid: number) => {
  const root = process.env.EAGLE_EYE_PATH

  if (!root) {
    console.error('EAGLE_EYE_PATH is not set... can\'t kill')
    return null
  }

  // on windows, we need to kill the child process
  const cmd = `${root}/backend/scripts/kill-process.ps1 ${pid}`
  return execSync(`powershell.exe -c ${cmd}`)
}

const stopProcess = (pid: number) => {
  try {
    // To-Do: Windows doesn't support signalling. Thats why we kill it the hard way
    if (os.platform() === 'win32') {
      return killAndStopWin32(pid)
    }

    return process.kill(pid, 'SIGINT')
  } catch (e) {
    console.log(`process ${pid} not running`, e)
    return false
  }
}

const killProcess = (pid: number) => {
  try {
    if (os.platform() === 'win32') {
      return killAndStopWin32(pid)
    }

    return process.kill(pid, 'SIGKILL')
  } catch (e) {
    console.log(`process ${pid} not running`, e)
    return false
  }
}

const executeJobInBackground = (
  config: SchedulerConfig,
  job: Job,
  logDirectory: string,
  io: Server,
  onStart: (pid: number | undefined, logFile: string) => void,
): Promise<{ executed: boolean, job: Job, code: number | null, error: Error | null }> => (
  new Promise((res) => {
    const logFile = `${logDirectory}/${job.id}.stdout.log`
    const logStream = fs.createWriteStream(logFile)

    const sourceCmd = config.source_cmd
    const { command } = config
    let args = []
    if (os.platform() === 'win32') {
      args = ['-c', `${sourceCmd}; python -u ${job.job_script_path} ${job.id}`]
    } else {
      args = ['-c', `${sourceCmd} && python3 -u ${job.job_script_path} ${job.id}`]
    }

    try {
      console.log('run', command, 'with args', args)
      const child = spawn(command, args)

      // have to fix handeling stdError file
      onStart(child.pid, logFile)

      child.stdout.on('data', (data) => {
        const newLine = handleOutputLine(STDOUT_PREFIX, data)
        logStream.write(newLine)
        io.emit(
          'job-log',
          {
            event_type: 'update',
            data: {
              log_data: newLine,
              job_id: job.id,
            },
          },
        )
      })
      child.stderr.on('data', (data) => {
        const newLine = handleOutputLine(STDERR_PREFIX, data)
        logStream.write(newLine)
        io.emit(
          'job-log',
          {
            event_type: 'update',
            data: {
              log_data: newLine,
              job_id: job.id,
            },
          },
        )
      })

      child.on('close', (code, signal) => {
        console.log('closing', code, signal)
        logStream.close()
        res({
          executed: true,
          job,
          code,
          error: null,
        })
      })
      child.on('error', (error) => (
        res({
          executed: true,
          job,
          code: 1,
          error,
        })
      ))
    } catch (e) {
      console.error('errrorrrrrrrr', e)
      logStream.close()
      res({
        executed: false,
        job,
        error: e as Error,
        code: null,
      })
    }
  })
)

const processJobsLoop = async (
  config: SchedulerServiceConfig,
  io: Server,
) => {
  const { db, schedulerInterval } = config

  const jobStore = JobStore({ db })
  const { logDirectory } = config

  const runningJobs = await jobStore.getJobsWithStatus('running', config.maxParallel + 1) || []
  const maxJobs = config.maxParallel - runningJobs.length

  // get as many jobs as possible that are scheduled
  const jobs = await jobStore.getJobsWithStatus('scheduled', maxJobs) || []
  if (jobs.length > 0) {
    jobs.forEach((job: Job) => {
      // execute them in parallel thread.
      const jobPromise = executeJobInBackground(
        config,
        job,
        logDirectory,
        io,
        (pid, outLog) => {
          Promise.all([
            jobStore.updateJobStatus(job.id, 'running'),
            jobStore.updateJobPid(job.id, pid as number),
            jobStore.updateJobLogPath(job.id, outLog),
          ])
            .then(() => jobStore.getJobById(job.id))
            .then((updatedJob) => {
              if (updatedJob !== null) {
                // emit message that job is running
                io.emit('job', {
                  data: updatedJob,
                  event_type: 'update',
                })
              }
            })

          console.log('start job', job.id, job.job_script_path)
        },
      )
      jobPromise.then((resp) => {
        console.log('job done', resp.job.id, resp.job.job_script_path, resp.code, resp.error)
        if (resp.code === 0) {
          return jobStore.updateJobStatus(resp.job.id, 'done')
        }
        return jobStore.updateJobStatus(resp.job.id, 'error')
      }).then(async () => {
        const updatedJob = await jobStore.getJobById(job.id)

        // emit message that job is finished
        io.emit(
          'job',
          {
            data: updatedJob,
            event_type: 'update',
          },
        )
      })
    })
  }

  setTimeout(() => {
    processJobsLoop(config, io)
  }, schedulerInterval)
}

const getJobs = ({ db }: { db: Database }) => async () => {
  const jobStore = JobStore({ db })

  return jobStore.getJobs()
}

const stopJob = ({ db }: { db: Database }) => async (
  jobId: number,
) => {
  const jobStore = JobStore({ db })
  const job = await jobStore.getJobById(jobId)

  if (!job) {
    return false
  }

  if (job.job_status !== 'running') {
    return false
  }

  return stopProcess(job.pid)
}

const killJob = ({ db }: { db: Database }) => async (
  jobId: number,
) => {
  const jobStore = JobStore({ db })
  const job = await jobStore.getJobById(jobId)

  if (!job) {
    return false
  }

  if (job.job_status !== 'running') {
    return false
  }

  return killProcess(job.pid)
}

const scheduleJob = ({ db }: { db: Database }) => async (
  jobScriptName: string,
  jobScriptPayload: string,
  userId: number,
): Promise<number | null> => {
  const jobStore = JobStore({ db })
  const eagleEyePath = process.env.EAGLE_EYE_PATH
  const jobScriptPath = `${String(eagleEyePath)}/modules/${jobScriptName}`

  const jobId = await jobStore.insertJob({
    jobScriptPath,
    jobScriptPayload,
    userId,
  })

  return jobId
}

const cleanUpRunningJobs = (db: Database) => async () => {
  const jobStore = JobStore({ db })

  const runningJobs = await jobStore.getRunningJobs()

  const killJobAndUpdateStatus = async (job: Job) => {
    console.log(`Killing running process ${job.pid}...`)
    killProcess(job.pid)
    const success = await jobStore.updateJobStatus(job.id, 'error')
    return success
  }

  if (runningJobs) {
    Promise.all(runningJobs.map((job) => killJobAndUpdateStatus(job)))
  }
}

const startScheduler = (config: SchedulerServiceConfig) => async (
  io: Server,
) => {
  await cleanUpRunningJobs(config.db)()
  const { logDirectory } = config

  if (fs.existsSync(logDirectory) === false) {
    fs.mkdirSync(logDirectory)
  }

  await processJobsLoop(config, io)
}

const getTailFile = () => async (path: string) => (
  new Promise((res, rej) => {
    exec(`tail ${path}`, (error, stdout, stderr) => {
      if (error) {
        rej(stderr)
      }
      res(stdout)
    })
  })
)

export type SchedulerServiceType = {
  getTailFile: ReturnType<typeof getTailFile>,
  startScheduler: ReturnType<typeof startScheduler>,
  scheduleJob: ReturnType<typeof scheduleJob>,
  stopJob: ReturnType<typeof stopJob>,
  killJob: ReturnType<typeof killJob>,
  getJobs: ReturnType<typeof getJobs>,
}

const SchedulerService = (config: SchedulerServiceConfig): SchedulerServiceType => ({
  getTailFile: getTailFile(),
  startScheduler: startScheduler(config),
  scheduleJob: scheduleJob(config),
  stopJob: stopJob(config),
  killJob: killJob(config),
  getJobs: getJobs(config),
})

export default SchedulerService
