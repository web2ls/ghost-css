import { read, walk } from 'files'
import Table from 'cli-table3'
import {
  getFilePathWithoutFilename,
  getFileNameWithoutExt,
  getTailDir
} from './utils.js'

const args = process.argv.slice(2)

if (args.length === 0 || args.length > 1) {
  console.log('Please provide a path to the directory you want to scan.')
  process.exit(1)
}

const userPath = args[0]
const table = new Table()

const t0 = performance.now()
const filesPaths = await walk(userPath)
  .filter(/[.tsx | .pcss]$/)
  .filter(
    (file) => !/node_modules|dist|build|coverage|\.git|\.js$|\.ts$/.test(file)
  )

const pathStore = new Map()
for (const filePath of filesPaths) {
  const pathToFileWithoutFileName = getFilePathWithoutFilename(filePath)

  if (pathStore.has(pathToFileWithoutFileName)) {
    const existsFilePath = pathStore.get(pathToFileWithoutFileName)[0]
    const existsFileName = getFileNameWithoutExt(existsFilePath)

    const newFileName = getFileNameWithoutExt(filePath)

    if (existsFileName === newFileName) {
      pathStore.set(pathToFileWithoutFileName, [existsFilePath, filePath])
    }
  } else {
    const tailDir = getTailDir(filePath)
    const newFileName = getFileNameWithoutExt(filePath)

    if (tailDir === newFileName) {
      pathStore.set(pathToFileWithoutFileName, [filePath])
    }
  }
}

pathStore.forEach((value, key) => {
  if (value.length !== 2) {
    pathStore.delete(key)
  }
})

for (const [key, value] of pathStore) {
  const cssFilePath = value.find((path) => path.endsWith('.pcss'))
  const tsxFilePath = value.find((path) => path.endsWith('.tsx'))

  if (!cssFilePath || !tsxFilePath) {
    continue
  }

  const cssFile = await read(cssFilePath)
  if (!cssFile) {
    console.error('css file not found on path: ' + cssFilePath)
    continue
  }

  const cssClasses = [...cssFile.matchAll(/\.(.*?)\s/g)].map((match) => {
    let item = match[0]
    item = item.replace(/^\.|\s$/g, '')
    return item.split(':')[0]
  })

  const uniqueCssClasses = [...new Set(cssClasses)]

  const ghostClasses = new Map()

  const tsxFile = await read(tsxFilePath)

  const formattedPath = getFilePathWithoutFilename(cssFilePath)

  uniqueCssClasses.forEach((cssClass) => {
    if (
      !tsxFile.includes(`styles.${cssClass}`) &&
      !tsxFile.includes(`s.${cssClass}`)
    ) {
      if (ghostClasses.has(formattedPath)) {
        ghostClasses.get(formattedPath).push(cssClass)
      } else {
        ghostClasses.set(formattedPath, [cssClass])
      }
    }
  })

  if (!ghostClasses.get(formattedPath)) {
    continue
  }
  table.push({
    [formattedPath]: ghostClasses.get(formattedPath)
      ? ghostClasses.get(formattedPath).join(', ')
      : []
  })
}

const t1 = performance.now()
console.log('Execution time: ' + (t1 - t0) + ' milliseconds.')

console.log(table.toString())
