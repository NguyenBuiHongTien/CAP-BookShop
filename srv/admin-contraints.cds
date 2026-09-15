using { AdminService } from './admin-service';

annotate AdminService.Books with {
  title  @mandatory;
  
  author @mandatory
         @assert: (case
           when not exists author then 'Specified Author does not exist'
         end);
         
  genre  @mandatory
         @assert: (case
           when not exists genre then 'Specified Genre does not exist'
         end);
         
  price  @assert.range: [1, 111];   // từ 1 đến 111
  stock  @assert.range: [0, _];     // >= 0
};