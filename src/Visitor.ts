import { capitalize, isArray, map, zipObject, keys, intersection } from 'lodash'

import { doc, Doc } from 'prettier'
const { group, join, hardline, softline, line, concat, indent, lineSuffix } = doc.builders

import { visitorKeys } from '@roku-road/bright'

const shouldBeVisitor = (method: string) => {
  return visitorKeys[method] && method.toUpperCase() !== method
}

export class PrettierVisitor {
  private flags: string[] = ['shortPrint']

  private shortPrint: boolean = false

  public constructor(private options) {
    const flags = intersection(keys(this.options), this.flags)
    map(flags, flag => (this[flag] = true))
  }

  public Program(ctx) {
    let { body } = this.visit(ctx)

    body = this.asArray(body)

    return join(hardline, body.filter(line => line !== ''))
  }

  public LibraryStatement(ctx): Doc {
    const { path } = this.visit(ctx)

    return join(' ', ['Library', path])
  }

  public UnTypedIdentifier({ name }): Doc {
    return name
  }

  public STRING_LITERAL(ctx) {
    return ctx.loc.source
  }

  public ParameterList(ctx): Doc {
    const { args } = this.visit(ctx)
    return group(concat(['(', join(', ', args), ')']))
  }

  public AdditionExpression(ctx) {
    return this.binary(ctx)
  }

  public AssignmentExpression(ctx) {
    return this.binary(ctx)
  }

  public MultiplicationExpression(ctx) {
    return this.binary(ctx)
  }
  public LogicExpression(ctx) {
    return this.binary(ctx)
  }

  public ParenthesisExpression(ctx) {
    return group(concat(['(', this.visit(ctx).expression, ')']))
  }

  public ArrayElement(ctx) {
    const { value } = this.visit(ctx)

    const parts: Doc[] = [join(': ', [value])]

    return group(concat(this.tail(parts, ctx)))
  }

  public ArrayExpression(ctx) {
    const { elements } = this.visit(ctx)
    return concat(['[', join(', ', elements), ']'])
  }

  public CallExpression(ctx) {
    const { args, callee } = this.visit(ctx)
    return group(concat([callee, args]))
  }

  public ConditionalConst(ctx) {
    return group(join(' ', ['#const', this.binary(ctx)]))
  }

  public ConditionalElseIfStatement(ctx) {
    const { test, body } = this.visit(ctx)
    const parts: Doc[] = [line]
    parts.push(group(join(' ', ['#else if', test, 'then'])))

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    return concat(this.tail(parts, ctx))
  }

  public ConditionalElseStatement(ctx) {
    const { body } = this.visit(ctx)
    const parts: Doc[] = [line]

    parts.push('#else')

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    return concat(this.tail(parts, ctx))
  }

  public ConditionalError(ctx) {
    const { error } = this.visit(ctx)
    console.log({ error })
  }

  public ConditionalIfStatement(ctx) {
    const { test, consequent, alternate } = this.visit(ctx)
    const parts: Doc[] = [line]

    parts.push(group(join(' ', this.tail(['#if', test, 'then'], ctx))))

    if (consequent) {
      parts.push(indent(concat([line, consequent])))
    }

    if (alternate) {
      map(this.asArray(alternate), block => {
        parts.push(concat([line, block]))
      })
    }

    parts.push(line, '#end if')

    return concat(parts)
  }

  public DimStatement(ctx) {
    const { id, ArrayExpression } = this.visit(ctx)
    group(concat(['dim', ' ', id, ArrayExpression]))
  }

  public DotMemberExpression(ctx) {
    const { operator, right } = this.visit(ctx)
    return concat([operator, right])
  }

  public ElseIfStatement(ctx) {
    const { test, body } = this.visit(ctx)
    const parts: Doc[] = [line]
    parts.push(group(join(' ', ['else if', test, 'then'])))

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    return concat(this.tail(parts, ctx))
  }

  public ElseStatement(ctx) {
    const { body } = this.visit(ctx)
    const parts: Doc[] = [line]

    parts.push('else')

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    return concat(this.tail(parts, ctx))
  }

  public EmptyStatement(ctx) {
    const { trailingComments } = this.visit(ctx)

    if (trailingComments) {
      return lineSuffix(trailingComments)
    }

    return ''
  }

  public Comment({ value, trailingComments }) {
    return group(concat(["' ", value || trailingComments]))
  }

  public ForEachStatement(ctx) {
    const { countExpression, body, counter } = this.visit(ctx)
    const parts: Doc[] = [line]

    const signature: Doc[] = this.tail(['for', 'each', counter, 'in', countExpression], ctx)

    parts.push(group(join(' ', signature)))

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    parts.push(line, 'end for')

    return concat(parts)
  }

  public ForStatement(ctx) {
    const { init, test, update, body } = this.visit(ctx)
    const parts: Doc[] = [line]

    const counter = this.Identifier(ctx.counter)

    const signature: Doc[] = this.tail(['for', counter, '=', init, 'to', test], ctx)

    if (update) {
      signature.push('step', update)
    }

    parts.push(group(join(' ', signature)))

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    parts.push(line, 'end for')

    return concat(parts)
  }

  public FunctionDeclaration(ctx) {
    const { id, params, ReturnType = '', body } = this.visit(ctx)
    return concat([hardline, group(join(' ', ['function', id, params, ReturnType])), indent(concat([hardline, body])), line, 'end function', line])
  }

  public FunctionExpression(ctx) {
    const { body, params, ReturnType } = this.visit(ctx)
    const signature = ['function', params]
    if (ReturnType) {
      signature.push(ReturnType)
    }

    return concat([group(join(' ', signature)), indent(concat([hardline, body])), line, 'end function'])
  }

  public GoToStatement(ctx) {
    const { id } = this.visit(ctx)
    group(join(' ', ['goto', id]))
  }

  public IfStatement(ctx) {
    const { test, consequent, alternate } = this.visit(ctx)
    const parts: Doc[] = [line]

    parts.push(group(join(' ', this.tail(['if', test, 'then'], ctx))))

    if (consequent) {
      parts.push(indent(concat([line, consequent])))
    }

    if (alternate) {
      map(this.asArray(alternate), block => {
        parts.push(concat([line, block]))
      })
    }

    parts.push(line, 'end if')

    return concat(parts)
  }

  public Literal({ value }) {
    return value
  }

  public MemberExpression(ctx) {
    const { object, properties } = this.visit(ctx)

    return concat([object, concat(this.asArray(properties))])
  }

  public NextStatement(ctx) {
    return concat(this.tail(['next'], ctx))
  }

  public PostfixExpression(ctx) {
    const { operator, argument } = this.visit(ctx)
    concat([argument, operator])
  }

  public PrintStatement(ctx) {
    const { value } = this.visit(ctx)
    const print = this.shortPrint ? '?' : 'print'

    return group(join(' ', this.tail([print, join(', ', this.asArray(value))], ctx)))
  }

  public RelationExpression(ctx) {
    return this.binary(ctx)
  }

  public ReturnStatement(ctx) {
    const { argument } = this.visit(ctx)
    return group(join(' ', this.tail(['return', argument], ctx)))
  }

  public StopStatement(ctx) {
    return concat(this.tail(['stop'], ctx))
  }

  public SubDeclaration(ctx) {
    const { id, params, body } = this.visit(ctx)

    return concat([hardline, group(join(' ', this.tail(['sub', id, params], ctx))), indent(concat([hardline, body])), line, 'end sub'])
  }

  public SubExpression(ctx) {
    const { body, params } = this.visit(ctx)
    const signature = this.tail(['sub', params], ctx)

    return concat([group(join(' ', signature)), indent(concat([hardline, body])), line, 'end sub'])
  }

  public UnaryExpression(ctx) {
    const { operator, argument } = this.visit(ctx)

    if (operator) {
      let spacing = ''

      if (operator.toLowerCase() === 'not') {
        spacing = ' '
      }

      return group(join(spacing, this.tail([operator, argument], ctx)))
    }

    return group(argument)
  }

  public WhileStatement(ctx) {
    const { test, body } = this.visit(ctx)

    const parts: Doc[] = [line]

    parts.push(group(join(' ', this.tail(['while', test], ctx))))

    if (body) {
      parts.push(indent(concat([line, body])))
    }

    parts.push(line, 'end while')

    return concat(parts)
  }

  public BlockStatement(ctx) {
    const { body } = this.visit(ctx)
    return join(hardline, this.asArray(body).filter(e => e !== ''))
  }

  public TypeAnnotation({ value }) {
    return value ? group(concat(['As', ' ', capitalize(value)])) : ''
  }

  public ObjectExpression(ctx) {
    const { properties } = this.visit(ctx)

    const props = (ctx.properties && ctx.properties.length) || 0
    let sep: Doc = hardline

    if (props === 0) {
      sep = softline
    } else if (props < 3) {
      sep = softline
    }

    return concat(['{', indent(concat(this.tail([sep, join(concat([', ', sep]), properties)], ctx))), sep, '}'])
  }

  public Parameter(ctx) {
    const { name, TypeAnnotation, value } = this.visit(ctx)
    const parts = []

    if (name) {
      parts.push(name)
    }

    if (value) {
      parts.push(concat(['= ', value]))
    }

    if (TypeAnnotation) {
      parts.push(TypeAnnotation)
    }

    return group(join(' ', parts))
  }

  public Identifier(ctx) {
    const { asType } = this.visit(ctx)
    return group(concat([ctx.name, asType]))
  }

  public visit(ctx) {
    if (!ctx.type) {
      return null
    }

    const keysToVisit = visitorKeys[ctx.type]
    const mapped = map(keysToVisit, key => {
      if (!ctx[key]) {
        return ctx[key]
      }

      if (ctx[key].type) {
        const method = ctx[key].type

        if (!this[method]) {
          if (shouldBeVisitor(method)) {
            console.warn(method)
          } else {
            return this.STRING_LITERAL(ctx[key])
          }
        } else {
          return this[method](ctx[key])
        }
      } else {
        if (isArray(ctx[key])) {
          return map(ctx[key], element => {
            const method = element.type

            if (!this[method]) {
              if (shouldBeVisitor(method)) {
                console.warn(method)
              } else {
                return this.STRING_LITERAL(element)
              }
            } else {
              return this[method](element)
            }
          })
        }
      }
    })

    return zipObject(keysToVisit, mapped)
  }

  protected asArray(value: Doc | Doc[]) {
    if (!value) {
      return []
    }
    return isArray(value) ? value : [value]
  }

  protected binary(ctx) {
    let { left, right, operator } = this.visit(ctx)

    left = this.asArray(left)
    right = this.asArray(right)
    operator = this.asArray(operator)

    return group(join(' ', this.mergeOperands(right, left, operator)))
  }

  protected mergeOperands(from = [], to = [], dividers = []) {
    while (from.length) {
      to.push(dividers.shift())
      to.push(from.shift())
    }

    return to
  }

  public Property(ctx): Doc {
    const { key, value } = this.visit(ctx)
    const parts: Doc[] = [join(': ', [key, value])]

    return group(concat(parts))
  }

  public Arguments(ctx) {
    const { param } = this.visit(ctx)

    return group(concat(['(', join(', ', this.asArray(param)), ')']))
  }

  protected tail(line: Doc[], ctx): Doc[] {
    if (ctx.trailingComments) {
      line.push(lineSuffix(this.Comment(ctx.trailingComments)))
    }

    return line
  }
}
