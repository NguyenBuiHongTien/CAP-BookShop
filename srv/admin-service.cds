using { sap.capire.bookshop as my } from '../db/schema';
service AdminService @(path:'/admin') {
  entity Authors as projection on my.Authors;
  entity Books as projection on my.Books
  actions {
    action UploadExcel();
  }
  entity Genres as projection on my.Genres;

  entity BooksFromRAP as projection on my.BooksFromRAP;
  action getBooksFromRAP() returns String;
}