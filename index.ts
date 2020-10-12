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
const isPathDifinitionObject = (arg: any): arg is TPathDifinitionObject => {
  return typeof arg === 'object' && arg.hasOwnProperty('type') && arg.hasOwnProperty('path');
}
const _isPathDifinitionObject = (args: any[]): args is TPathDifinitionObject[] => {
  return args.every(isPathDifinitionObject);
}

const isStringOrRegexp = (args: any[]): args is Array<string | RegExp> => {
  return !_isPathDifinitionObject(args);
}

// ###### function
const str2regexp = (str: string) => pathToRegexp(str);
const toArray = (data: TPathDifinition): Array<string | RegExp | TPathDifinitionObject> => Array.isArray(data) ? data : [data];
const toRegExpArr = (data: TExpressPathDifinition): RegExp[] => {
  const array = Array.isArray(data) ? data : [data];
  return array.map((arr) => (typeof arr === 'string' ? str2regexp(arr) : arr ));
}

/** TPathDifinitionObject[]に変換。さらにPathDifinitionObjectのpathをRegExp[]に揃える */
const toPathDifinitionObject = (data: Array<string | RegExp | TPathDifinitionObject>): { type: TPathType, path: RegExp[]}[] => {
  if (_isPathDifinitionObject(data)) {
    return data.map((dt) => ({ type: dt.type, path: toRegExpArr(dt.path)}));
  };

  if (isStringOrRegexp(data)) {
    return [{ type: 'include', path: toRegExpArr(data)}];
  } 
}

/** 引数のregexp[]にpathが含まれていればtrue */
const matchWithRegexp = (RegexpArr: RegExp[], path: string) => RegexpArr.some(((regexp) => regexp.exec(path) !== null));

/** 引数のpathDifinitionのpath(RegExp[])に最初の引数のpathが含まれていればtrue. (pathDifinitionのtypeがexcludeの場合は含まれていればfalse) */
const _isMatch = (path: string) => (pathDifinition: ReturnType<typeof toPathDifinitionObject>[0]) => {
  return pathDifinition.type === 'exclude' ? !matchWithRegexp(pathDifinition.path, path) : matchWithRegexp(pathDifinition.path, path)
}

const isMatch = (pathDifinition: TPathDifinition, path: string) => {
  const pathDifinitionArr = toArray(pathDifinition);
  const pathDifinitionObjectArr = toPathDifinitionObject(pathDifinitionArr);
  return pathDifinitionObjectArr.every(_isMatch(path));
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