// using { sap.capire.bookshop as my } from '../db/schema';

service UploadService @(path: '/upload') {

  action uploadBooksFromBase64(
    fileBase64 : LargeString,
    fileName   : String
  ) returns {
    success  : Boolean;
    message  : String;
    inserted : Integer;
    errors   : many String;
  };


  action uploadGenresFromBase64(
    fileName   : String,
    fileBase64 : LargeString
  ) returns {
    success  : Boolean;
    message  : String;
    inserted : Integer;
    updated  : Integer;
    errors   : many String;
  };
}