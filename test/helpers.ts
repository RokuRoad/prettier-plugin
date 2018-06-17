import { readFileSync } from 'fs'
import { check, format, Options } from 'prettier'
import { resolve } from 'path'

export const scanFile = (path: string) => {
  const sourceCode = readFileSync(path, 'utf8')

  return scanSource(sourceCode, path)
}

export const scanSource = (sourceCode, path = '') => {
  const settings: Options = {
    filepath: path,
    parser: 'brs',
    plugins: [resolve('./src/index.ts')],
    printWidth: 120,
    tabWidth: 4,
    useTabs: false
  }

  if (check(sourceCode, settings)) {
    return null
  }

  return format(sourceCode, settings)
}

describe('Helpers', () => {
  it('Should exist', () => {
    expect(scanSource).toBeTruthy()
    expect(scanFile).toBeTruthy()
  })
})
