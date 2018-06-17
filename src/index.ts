import { ast } from '@roku-road/bright'
import { PrettierVisitor } from './Visitor'

export const languages = [
  {
    aceMode: 'text',
    extensions: ['.brs'],
    linguistLanguageId: 39,
    name: 'brs',
    parsers: ['brsParser'],
    since: '1.5.0',
    tmScope: 'source.brightscript',
    vscodeLanguageIds: ['brs']
  }
]

export const parsers = {
  brs: {
    astFormat: 'bright',
    parse: (source: string) => ast(source),
    locStart: (node): number => node.range && node.range[0],
    locEnd: (node): number => node.range && node.range[1]
  }
}

export const printers = {
  bright: {
    print: (path, options) => {
      return new PrettierVisitor(options).Program(path.getNode())
    }
  }
}

export const options = {
  //Plugin flags
  shortPrint: true,

  // Common flags
  printWidth: 120,
  semi: false,
  tabWidth: 4
}
