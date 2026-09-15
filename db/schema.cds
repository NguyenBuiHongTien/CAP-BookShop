using { Currency, managed, cuid, sap } from '@sap/cds/common';

namespace sap.capire.bookshop;

entity Books : cuid, managed {
  title    : localized String(111);
  descr    : localized String(1111);
  author   : Association to Authors;
  genre    : Association to Genres;
  stock    : Integer;
  price    : Decimal(9,2);
  currency : Currency default 'USD';
}

entity Authors : cuid, managed {
  name  : String(111);
  books : Association to many Books on books.author = $self;
}

entity Genres : sap.common.CodeList {
  key ID   : Integer;
  parent   : Association to Genres;
  children : Composition of many Genres on children.parent = $self;
}

entity BooksFromRAP  {
    key ID            : UUID;
    title             : String;
    author            : String;
    genre             : String;
    price             : Decimal(10,2);
    stock             : Integer;
    currency_code     : String(5);
    source            : String;
  }