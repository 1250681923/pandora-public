import fs from "fs" ;
import jsonPrint from "json-beautify" ;
const staticDescription = "./static.json" ;
const testDescription = "./hadoc.json" ;
const rootFolderTestSuite = "./testSuite/" ;
const target = "../dist/autograding.json" ;
const referencePandora = "referencePandora.jar" ;
let autogradingTests = { tests: [] } ;

fs.readFile( staticDescription, "utf8", parseStatic ) ;
function parseStatic( err, jsonString ) {
  if( err ) throw err ;
  autogradingTests = JSON.parse( jsonString ) || { tests: [] } ;
  fs.readFile( testDescription, "utf8", parseHadoc ) ;
}

/**
 * parseHadoc - take our hadoc json file
 *
 * @param  {Error} err
 * @param  {Strign} jsonString json string
 */
function parseHadoc( err, jsonString ) {
  if( err ) throw err ;

  const hadocTests = JSON.parse( jsonString ) ;

  for ( const test of hadocTests ) {
    autogradingTests.tests.push( new AutoGradingTest( test ) ) ;
  }
  fs.writeFile( target, jsonPrint( autogradingTests, null, 2, 80 ), "utf8", console.log ) ;
}

class AutoGradingTest {
  constructor( { name, optionLine, testFile } ) {
    const destFolder = `__autograding/${ cleanName( name ) }` ;
    const sourceFile = ( testFile || testFile === "" ) ? "" : rootFolderTestSuite + testFile ;
    this.name = name ;
    this.setup = `\
mkdir -p ${ destFolder } ; \
java -jar target/${ referencePandora } ${ optionLine } ${ sourceFile } &> ${ destFolder }/expected ; \
java -jar target/pandora.jar ${ optionLine } ${ sourceFile } &> ${ destFolder }/output` ;
    this.run = `\
diff -qs -iBbd --strip-trailing-cr ${ destFolder }/expected ${ destFolder }/output ;
diff -qs -iBbd --strip-trailing-cr ${ destFolder }/expected ${ destFolder }/output &>> __autograding/result.txt` ;
    this.input = "" ;
    this.output = "identical" ;
    this.comparison = "included" ;
    this.timeout = 10 ;
    this.points = 1 ;
  }
}


/**
 * cleanName - Remove char unfit for a folder name
 *
 * @param  {String} name testName to be converted
 * @return {String}      cleanFolderName
 */
function cleanName( name ) {
  return name.replace( /(?:\s|\t|[.])+/g, "_" ) ;
}
