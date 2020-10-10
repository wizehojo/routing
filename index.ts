import { pathToRegexp } from 'path-to-regexp';

// ###### type
type TExpressPathDifinition = string | RegExp | Array<string | RegExp>;
type TPathType = 'include' | 'exclude'
type TPathDifinitionObject = {
  type: TPathType;
  path: TExpressPathDifinition;
}
type TPathDifinition =
  | TExpressPathDifinition
  | TPathDifinitionObject
  | Array<TPathDifinitionObject>


// ###### type guard
const isString = (args: any[]): args is string[] => {
  return args.every((arg) => typeof arg === 'string');
}
const isPathDifinitionObject = (args: any[]): args is TPathDifinitionObject[] => {
  return args.every((arg) => typeof arg === 'object' && arg.hasOwnProperty('type') && arg.hasOwnProperty('path'));
}
const isRegExp = (args: any[]): args is RegExp[] => {
  return args.every((arg) => arg instanceof RegExp);
}

// ###### function

/** 配列に変換 */
const toArray = (data: string | RegExp | TPathDifinitionObject | Array<string | RegExp | TPathDifinitionObject>): Array<string | RegExp | TPathDifinitionObject> => Array.isArray(data) ? data : [data];

/** 引数のstring[]にpathが含まれていればtrue */
const matchWithStr = (strArr: string[], path: string) => strArr.some((str) => {
  const regexp = pathToRegexp(str);
  return regexp.exec(path) !== null;
});
/** 引数のregexp[]にpathが含まれていればtrue */
const matchWithRegexp = (RegexpArr: RegExp[], path: string) => RegexpArr.some(((regexp) => regexp.exec(path) !== null));
/** 引数のpathDifinitionObjectのpathと第二引数のpathが一致すればtrue. (typeがexcludeの場合は一致すればfalse) */
const matchWithPathDifinitionObject = (pathDifinitionObject: TPathDifinitionObject, path: string): boolean => {
  const { type } = pathDifinitionObject;
  const pathDifinitionArr = toArray(pathDifinitionObject.path);
  const isMatch = _isMatch(pathDifinitionArr, path);
  // excludeならmatchしていた場合falseを返す。
  return type === 'exclude' ? !isMatch : isMatch;
}

const _isMatch = (arr: Array<string | RegExp | TPathDifinitionObject>, path: string) => {
  if (isString(arr)) {
    return matchWithStr(arr, path);
  }
  if (isRegExp(arr)) {
    return matchWithRegexp(arr, path);
  }
}


const isMatch = (pathDifinition: TPathDifinition, path: string) => {
  const pathDifinitionArr = toArray(pathDifinition);
  if (isPathDifinitionObject(pathDifinitionArr)) {
    return pathDifinitionArr.every((pathDifinition) => matchWithPathDifinitionObject(pathDifinition, path));
  }
  return _isMatch(pathDifinitionArr, path);
}



// ####### test

/** isMatchの第一引数がstring */
const StrParams = () => {
  const pathStrArr = ['/user/:id', '/project/:id', '/company', 'orderer', 'expert', 'news', 'content'];
  console.log('path1', isMatch(pathStrArr, '/project/123')); // true
  console.log('path2', isMatch(pathStrArr, '/project')); // false
  console.log('path3', isMatch(pathStrArr, '/client')); // false


  const pathStr = '/user/:id'
  console.log('path4', isMatch(pathStr, '/project/123')); // false
  console.log('path5', isMatch(pathStr, '/user/123')); // true
}

/** isMatchの第一引数がregexp */
const RegexpParams = () => {
  const pathRegexpArr = [/\/project\/\d/, /\/client\/[a-z]/];
  console.log('path11', isMatch(pathRegexpArr, '/project/123')); // true
  console.log('path12', isMatch(pathRegexpArr, '/company')); // false
  console.log('path13', isMatch(pathRegexpArr, '/client/111')); // false
  console.log('path14', isMatch(pathRegexpArr, '/client/aaa')); // true

  const pathRegexp = /user/;
  console.log('path15', isMatch(pathRegexp, '/project/123')); // false
  console.log('path16', isMatch(pathRegexp, '/user/123')); // true
}

/** isMatchの第一引数が{ type: ~, path: ~ } */
const pathDifinitionObjectParams = () => {
  const excludePath = ['/company/:id', '/billing'];
  const includePath = ['/user/:id', '/project/:id', '/company', '/orderer', '/expert', '/news', '/content'];
  
  const pathDifinition1: TPathDifinitionObject[] = [
    {
      type: 'exclude',
      path: excludePath
    },
    {
      type: 'include',
      path: includePath
    }
  ]
  console.log('path21', isMatch(pathDifinition1, '/company/122')); // false
  console.log('path22', isMatch(pathDifinition1, '/company')); // true
  console.log('path23', isMatch(pathDifinition1, '/project/345')); // true


  const pathDifinition2: TPathDifinitionObject = {
    type: 'include',
    path: includePath
  }
  console.log('path24', isMatch(pathDifinition2, '/user/123')) // true
  console.log('path25', isMatch(pathDifinition2, '/info')) // false
}

// 以下のコメントアウトを外すとテストできます
// StrParams();
// RegexpParams();
// pathDifinitionObjectParams();