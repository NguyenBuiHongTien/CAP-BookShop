service ExportService  @(path: '/export') {

  action exportBooksToExcel (bookIDs: array of UUID) returns {
    fileName   : String;
    fileBase64 : LargeString;
    message    : String;
    count      : Integer;
  };
}