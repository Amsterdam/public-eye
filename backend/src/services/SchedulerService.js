const JobStore = require('../data/JobStore')
const process = require('process')
const fs = require('fs')
const { spawn, exec } = require('child_process')
const os = require('os')

const STDERR_PREFIX = '&$'
const STDOUT_PREFIX = '$&'

const handleOutputLine = (prefix, data) => `${prefix}${data}`.replace(/\n/g, "\\n") + '\n'

const killProcess = (pid) => {
  try {
    process.kill(pid, 'SIGKILL')
  } catch (e) {
    console.log(`process ${pid} not running`)
  }
}

const executeJobInBackground = (config, job, logDirectory, io, onStart = async ()=>{}) => {
  return new Promise((res, rej) => {
    const logFile = `${logDirectory}/${job.id}.stdout.log`
    const logStream = fs.createWriteStream(logFile)
  
    const source_cmd = config.source_cmd
    const command = config.command
    let args = []
    if (os.platform() === 'win32') {
      args = ['-c', `${source_cmd}; python3 -u ${job.job_script_path} ${job.id}`]
    } else {
      args = ['-c', `${source_cmd} && python3 -u ${job.job_script_path} ${job.id}`]
    }

    try {
      console.log('run', command, 'with args', args)
      const child = spawn(command, args)

      // have to fix handeling stdError file
      onStart(child.pid, logFile)

      child.stdout.on('data', data => {
        const newLine = handleOutputLine(STDOUT_PREFIX, data)
        logStream.write(newLine)
        io.emit(
          'job-log',
          {
            event_type: 'update',
            data: {
              log_data: newLine,
              job_id: job.id,
            }
          }
        )
      })
      child.stderr.on('data', data => {
        const newLine = handleOutputLine(STDERR_PREFIX, data)
        logStream.write(newLine)
        io.emit(
          'job-log',
          {
            event_type: 'update',
            data: {
              log_data: newLine,
              job_id: job.id,
            }
          }
        )
      })

      child.on('close', (code, signal) => {
        console.log('closing', code, signal)
        logStream.close()
        res({executed: true, job, code, error: null})
      })
      child.on('error', error => {
        res({executed: true, job, code: 1, error: error})
      })
    } catch (e) {
      console.error('errrorrrrrrrr', e)
      logStream.close()
      res({executed: false, job, error: e, code: null})
    }
  }).catch(e => {
      console.error('errrorrrrrrrr', e)

      return {executed: false, job, error: e, code: null}
  })
}

const processJobsLoop = async (config, io) => {
  const { db, schedulerInterval  } = config

  const jobStore = JobStore({ db })

  const logDirectory = config.logDirectory

  const runningJobs = await jobStore.getJobsWithStatus('running', config.maxParallel + 1)

  const maxJobs = config.maxParallel - runningJobs.length

  // get as many jobs as possible that are scheduled
  const jobs = await jobStore.getJobsWithStatus('scheduled', maxJobs)
  if (jobs.length > 0) {
    for (const job of jobs) {
      // execute them in parallel thread.
      const jobPromise = executeJobInBackground(config, job, logDirectory, io, (pid, outLog, errLog) => {
        Promise.all([
          jobStore.updateJobStatus(job.id, "running"),
          jobStore.updateJobPid(job.id, pid),
          jobStore.updateJobLogPath(job.id, outLog),
          jobStore.updateJobErrLogPath(job.id, errLog)

        ])
          .then(() => jobStore.getJobById(job.id))
          .then((updatedJob) => {
            // emit message that job is running
            io.emit('job', {
              data: updatedJob,
              event_type: 'update',
            })
          })
        
          console.log('start job', job.id, job.job_script_path)
      })
      jobPromise.then(resp => {
        console.log('job done', resp.job.id, resp.job.job_script_path, resp.code, resp.error)
        if (resp.code === 0) {
          return jobStore.updateJobStatus(resp.job.id, "done")
        } else {
          return jobStore.updateJobStatus(resp.job.id, "error")
        }
      }).then(async () => {
        const updatedJob = await jobStore.getJobById(job.id)

        // emit message that job is finished
        io.emit(
          'job', 
          {
            data: updatedJob,
            event_type: 'update',
          }
        ) 
      })
    }
  }

  setTimeout(() => processJobsLoop(config, io), schedulerInterval)
}

const getJobs = ({ db }) => async () => {
  const jobStore = JobStore({ db })

  return jobStore.getJobs()
}
  
const stopJob = ({ db }) => async (jobId) => {

  const jobStore = JobStore({ db })
  const job = await jobStore.getJobById(jobId)

  if (!job) {
    return false
  }

  if (job.job_status !== 'running') {
    return false
  }

  try {
    process.kill(job.pid, 'SIGINT')
  } catch (e) {
    console.error(e)
  }

  return true
}

const killJob = ({ db }) => async (jobId) => {
  const jobStore = JobStore({ db })
  const job = await jobStore.getJobById(jobId)

  if (!job) {
    return false
  }

  if (job.job_status !== 'running') {
    return false
  }

  killProcess(job.pid)
}


const scheduleJob = ({ db }) => async (
  jobScriptName,
  jobScriptPayload,
  userId,
) => {
  const jobStore = JobStore({ db })

  const eagleEyePath = process.env['EAGLE_EYE_PATH']
  
  const jobScriptPath = `${eagleEyePath}/modules/${jobScriptName}`

  return await jobStore.insertJob({
    jobScriptPath,
    jobScriptPayload,
    userId,
  })
}

const cleanUpRunningJobs = (db) => async () => {
  const jobStore = JobStore({ db })

  const runningJobs = await jobStore.getRunningJobs()

  runningJobs.forEach(async (job) => {
    console.log(`Killing running process ${job.pid}...`)
    killProcess(job.pid)
    await jobStore.updateJobStatus(job.id, 'error')
  })
}

const startScheduler = (config) => async (io) => {

  await cleanUpRunningJobs(config.db)()
  const logDirectory = config.logDirectory

  if (fs.existsSync(logDirectory) === false) {
    fs.mkdirSync(logDirectory)
  }

  await processJobsLoop(config, io)
}

const getTailFile = () => async (path) => {
  return new Promise((res, rej) => {
    exec(`tail ${path}` , (error, stdout, stderr) => {
      if (error) {
        rej(stderr)
      }
      res(stdout)
    })
  })
}

const SchedulerService = (config) => {
  return {
    getTailFile: getTailFile(),
    startScheduler: startScheduler(config),
    scheduleJob: scheduleJob(config),
    stopJob: stopJob(config),
    killJob: killJob(config),
    getJobs: getJobs(config),
  }
}

module.exports = SchedulerService
