using { sap.capire.bookshop as my } from '../db/schema';

service CatalogService @(odata: '/browse') {

  @readonly
  entity Books as projection on my.Books {
    *, 
    author.name as author,
    genre.name  as genre
  } excluding { createdBy, modifiedBy };

 
  action submitOrder (book: Books:ID, quantity: Integer) returns Boolean;
}