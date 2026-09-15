const cds = require('@sap/cds');
const XLSX = require('xlsx');

module.exports = class ExportService extends cds.ApplicationService {
    
  async init() {

    this.on('exportBooksToExcel', async (req) => {
      try {
        const { Books, Authors, Genres } = cds.entities('sap.capire.bookshop');
        const bookIDs = req.data.bookIDs || [];

        if (!bookIDs.length) {
          return req.error(400, 'Không có dòng nào được chọn để export');
        }

        // Chỉ lấy những book có ID nằm trong danh sách frontend gửi lên
        const books = await SELECT.from(Books)
          .columns('ID', 'title', 'descr', 'stock', 'price', 'currency_code', 'author_ID', 'genre_ID')
          .where({ ID: { in: bookIDs } });

        // 2. Map author & genre
        const authors = await SELECT.from(Authors).columns('ID', 'name');
        const genres  = await SELECT.from(Genres).columns('ID', 'name');

        const authorMap = {};
        authors.forEach(a => { authorMap[a.ID] = a.name; });

        const genreMap = {};
        genres.forEach(g => { genreMap[g.ID] = g.name; });

        // 3. Chuẩn bị rows cho Excel
        const rows = books.map(b => ({
          Title: b.title || '',
          Author: authorMap[b.author_ID] || '',
          Genre: genreMap[b.genre_ID] || '',
          Description: b.descr || '',
          Stock: b.stock ?? 0,
          Price: b.price ?? 0,
          Currency: b.currency_code || 'USD'
        }));

        // 4. Tạo workbook
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Books');

        worksheet['!cols'] = [
          { wch: 30 }, // Title
          { wch: 20 }, // Author
          { wch: 18 }, // Genre
          { wch: 40 }, // Description
          { wch: 10 }, // Stock
          { wch: 12 }, // Price
          { wch: 10 }  // Currency
        ];

        // 5. Xuất Base64
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const fileBase64 = buffer.toString('base64');

        return {
          fileName: 'Books_Export.xlsx',
          fileBase64,
          message: `Exported ${rows.length} book(s)`,
          count: rows.length
        };

      } catch (err) {
        console.error(err);
        return req.error(500, err.message || 'Export failed');
      }
    });

    await super.init();
  }
};