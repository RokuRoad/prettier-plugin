import { scanFile, scanSource } from './helpers'
import { resolve } from 'path'

describe('Base test', () => {
  it('Should format basic file', () => {
    scanFile(resolve('test/assets/test1.brs'))
  })

  it('Should format basic source', () => {
    scanSource(`function a(p1 = 50 as integer, p2) as dynamic
      a# = 5
      b = (5 * 10) - 4 mod 5 / 8-- + ++9

      c = m.top.findNode(4,5,6, "param")
      call2.m.f.d.d(4,5,"sss")

      ' object definition
      a = {
        b:4, 'some comment
        c: function(p2 as object, p3="" as string) ' and another one
          end function
      }

    endfunction`)
  })

  it('Should format basic source #2', () => {
    scanSource(`'*****************************************************************
' Copies all fields from associative array to content node.
' Generally used for transforming parsed content from feed
' to special node type that is used by other RSG nodes.
' @param contentList As Object - associative array
' @return As Object - valid ContentNode
'*****************************************************************
function Utils_ContentList2Node(contentList as Object) as Object
    result = createObject("roSGNode","ContentNode")
    
    for each itemAA in contentList
        item = createObject("roSGNode", "ContentNode")
        item = Utils_AAToContentNode(itemAA)
        result.appendChild(item)
    end for
    
    return result
end function`)
  })

  it.only('Rodash', () => {
    const source = `
'File 1
Library "llll"

'/**
'* @member intersection
'* @memberof module:rodash
'* @instance
'* @description Return a new array of items from the first which are also in the second.
'* @param {Array} first
'* @param {Array} second
'* @example
'*
'* intersection = _.intersection([1,2], [2])
'* ' => [2]
'*/

function intersection (first, second)
    result = []

    #const a = 5

    For i=10 To 1 Step -1
      print i
    End For

    #if a > 5
      print a
    #else if a < 5
      print a
    #else
      print a
    #endif

    For i=1 To 10                       'comment1
      print i                           'comment2
    End For                             'comment3

    for each f in first                 'comment4
        for each s in second            'comment5
            if m.equal(s, f) then       'comment6
              'result.top.push(f)
                result.top.push(f)      'comment7
            end if                      'comment8
        end for                         'comment9
    end for                             'comment10
    return result                       'comment11
end function`

    console.log(scanSource(source.trim()))

    // expect().toEqual(source.trim())
  })
})
