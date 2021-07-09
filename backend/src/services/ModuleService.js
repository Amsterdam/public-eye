const fs = require('fs')

module.exports = (modulePath) => {
  const modules = fs.readdirSync(modulePath)
  const argSpecFiles = modules.filter(module => module.endsWith('args.json'))
  const argsSpec = {}

  argSpecFiles.forEach((file) => {
    try {
      const json = JSON.parse(fs.readFileSync(`${modulePath}/${file}`))
      const moduleName = file.replace('-args.json', '.py')
      argsSpec[moduleName] = json
    } catch (e) {
      console.error(`Error while trying to load module arg spec: ${file} `, e)
    }
  })

  const getArgumentSpecs = () => {
    return argsSpec
  }

  return {
    getArgumentSpecs,
  }
}