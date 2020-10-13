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


type TConvertedPathDifinitionObject = {
  type: TPathType;
  path: RegExp[];
};

// ###### type guard
const isStringOrRegExp = (x: unknown): x is string | RegExp => typeof x === 'string' || x instanceof RegExp;
const isExpressPathDifinition = (x: unknown): x is TExpressPathDifinition => !Array.isArray(x) ? isStringOrRegExp(x) : x.every(isStringOrRegExp);


// ###### function

const str2regexp = (str: string | RegExp) => typeof str === 'string' ? pathToRegexp(str) : str;

const expressPathDifinition2RegExpArr = (expressPathDifinition: TExpressPathDifinition): RegExp[] =>
  (Array.isArray(expressPathDifinition) ? expressPathDifinition : [expressPathDifinition]).map(str2regexp);


const matchWithRegexp = (regexpArr: RegExp[], path: string) => regexpArr.some((v) => v.test(path));


const _isMatch = (pathDef: TConvertedPathDifinitionObject, path: string): boolean =>
    pathDef.type === 'include' ? matchWithRegexp(pathDef.path, path) : !matchWithRegexp(pathDef.path, path);


const toConvertedPathDifinitionObjects = (pathDifinition: TPathDifinition): TConvertedPathDifinitionObject[] => {
  if (isExpressPathDifinition(pathDifinition)) {
    return [{ type: 'include', path: expressPathDifinition2RegExpArr(pathDifinition)}];
  } else {
    return (Array.isArray(pathDifinition) ? pathDifinition : [pathDifinition]).map((v) =>
      ({ ...v, path: expressPathDifinition2RegExpArr(v.path)})
    );
  }
};

const isMatch = (pathDifinition: TPathDifinition, path: string): boolean =>
  toConvertedPathDifinitionObjects(pathDifinition).every((v) => _isMatch(v, path));


// isMatch をこんな風にすると、フレームワークでより使いやすいかな。
// const createMatcher = (pathDifinition: TPathDifinition): (path: string) => boolean =>
//   (path: string) => toConvertedPathDifinitionObjects(pathDifinition).every((v) => _isMatch(v, path));


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