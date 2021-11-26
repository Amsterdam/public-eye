import fs from 'fs'

export type ModuleServiceType = {
  getArgumentSpecs: () => Record<string, Record<string, number | string>>
}

const ModuleService = (modulePath: string): ModuleServiceType => {
  const modules = fs.readdirSync(modulePath)
  const argSpecFiles = modules.filter(
    (module) => module.endsWith('args.json'),
  )
  const argsSpec: Record<string, Record<string, number | string>> = {}

  argSpecFiles.forEach((file) => {
    try {
      // eslint-disable-next-line
      const json = JSON.parse(
        String(fs.readFileSync(`${modulePath}/${file}`)),
      ) as Record<string, number | string>
      const moduleName = file.replace('-args.json', '.py')
      argsSpec[moduleName] = json
    } catch (e) {
      console.error(`Error while trying to load module arg spec: ${file} `, e)
    }
  })

  const getArgumentSpecs = () => argsSpec

  return {
    getArgumentSpecs,
  }
}

export default ModuleService
