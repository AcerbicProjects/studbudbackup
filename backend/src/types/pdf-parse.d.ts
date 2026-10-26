// The library entry has no typings of its own; reuse the package's types
declare module 'pdf-parse/lib/pdf-parse.js' {
  import pdfParse from 'pdf-parse';
  export default pdfParse;
}
