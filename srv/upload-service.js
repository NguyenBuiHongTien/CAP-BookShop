const cds = require('@sap/cds');
const XLSX = require('xlsx');
const { Readable } = require('stream');

module.exports = class UploadService extends cds.ApplicationService {

  async init() {

    const { Books, Authors, Genres } = cds.entities('sap.capire.bookshop');

    // // =====================================================
    // // 1. Handler nhận file Excel qua Media (PUT)
    // // =====================================================
    // this.on('PUT', 'ExcelUpload', async (req) => {
    //   if (!req.data.excel) {
    //     return req.error(400, 'No file uploaded');
    //   }

    //   try {
    //     // Đọc stream thành Buffer
    //     const buffer = await this._streamToBuffer(req.data.excel);

    //     // Parse Excel
    //     const result = await this._processExcel(buffer, { Books, Authors, Genres });

    //     // Trả về thông báo (vì Media PUT không trả body phức tạp)
    //     console.log('Upload result:', result);
    //     return result;

    //   } catch (err) {
    //     console.error('Upload error:', err);
    //     return req.error(500, err.message || 'Upload failed');
    //   }
    // });

    // =====================================================
    // 2. Action dùng Base64 (dễ test bằng HTTP / Postman)
    // =====================================================
    this.on('uploadBooksFromBase64', async (req) => {
      const { fileBase64, fileName } = req.data;

      if (!fileBase64) {
        return req.error(400, 'fileBase64 is required');
      }

      try {
        const buffer = Buffer.from(fileBase64, 'base64');
        const result = await this._processExcel(buffer, { Books, Authors, Genres });
        return result;
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: err.message,
          inserted: 0,
          errors: [err.message]
        };
      }
    });

    this.on('uploadGenresFromBase64', async (req) => {
      const { fileBase64, fileName } = req.data;

      if (!fileBase64) {
        return req.error(400, 'fileBase64 is required');
      }

      try {
        const buffer = Buffer.from(fileBase64, 'base64');
        const result = await this._processGenresExcel(buffer, Genres);
        return result;
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: err.message,
          inserted: 0,
          updated: 0,
          errors: [err.message]
        };
      }
    });

    await super.init();
  }

  // =====================================================
  // Helper: Convert stream → Buffer
  // =====================================================
  _streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  // =====================================================
  // Core logic: Đọc Excel + Insert Books
  // =====================================================
  async _processExcel(buffer, entities) {
    const { Books, Authors, Genres } = entities;

    // Đọc workbook
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
      raw: false
    });

    if (!rows.length) {
      throw new Error('Excel file is empty');
    }

    const booksToInsert = [];
    const errors = [];

    // Lấy danh sách Author & Genre hiện có để map
    const allAuthors = await SELECT.from(Authors).columns('ID', 'name');
    const allGenres  = await SELECT.from(Genres).columns('ID', 'name');

    const   authorMap = {};
    allAuthors.forEach(a => authorMap[a.name?.toLowerCase()?.trim()] = a.ID);

    const genreMap = {};
    allGenres.forEach(g => genreMap[g.name?.toLowerCase()?.trim()] = g.ID);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header = 1)

      try {
        const title = (row.title || row.Title || '').toString().trim();
        if (!title) {
          errors.push(`Row ${rowNum}: Missing title`);
          continue;
        }

        const authorName = (row.author || row.Author || '').toString().trim();
        const genreName  = (row.genre  || row.Genre  || '').toString().trim();

        let author_ID = authorMap[authorName.toLowerCase()];
        let genre_ID  = genreMap[genreName.toLowerCase()];

        // Nếu Author chưa có → tự tạo mới
        if (authorName && !author_ID) {
          const newAuthor = await INSERT.into(Authors).entries({ name: authorName });
          // Lấy ID vừa insert (tùy version CAP)
          const created = await SELECT.one.from(Authors).where({ name: authorName });
          author_ID = created?.ID;
          authorMap[authorName.toLowerCase()] = author_ID;
        }

        // Nếu Genre chưa có → báo lỗi (vì Genre dùng Integer + CodeList)
        if (genreName && !genre_ID) {
          errors.push(`Row ${rowNum}: Genre "${genreName}" not found`);
          continue;
        }

        booksToInsert.push({
          title,
          descr: (row.descr || row.Description || row.description || '').toString(),
          author_ID: author_ID || null,
          genre_ID: genre_ID || null,
          stock: parseInt(row.stock || row.Stock || 0) || 0,
          price: parseFloat(row.price || row.Price || 0) || 0,
          currency_code: (row.currency || row.Currency || 'USD').toString().toUpperCase()
        });

      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    // Insert hàng loạt
    let inserted = 0;
    if (booksToInsert.length > 0) {
      await INSERT.into(Books).entries(booksToInsert);
      inserted = booksToInsert.length;
    }

    return {
      success: errors.length === 0,
      message: `Inserted ${inserted} book(s). ${errors.length} error(s).`,
      inserted,
      errors
    };
  }


  async _processGenresExcel(buffer, Genres) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: null,
      raw: false
    });

    if (!rows.length) {
      throw new Error('Excel file is empty');
    }

    let inserted = 0;
    let updated = 0;
    const errors = [];

    // Lấy max ID hiện tại
    const maxResult = await SELECT.one`max(ID) as maxID`.from(Genres);
    let nextID = (maxResult?.maxID || 0) + 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const name = (row.name || row.Name || row.genre || row.Genre || '')
          .toString()
          .trim();

        if (!name) {
          errors.push(`Row ${rowNum}: Missing name`);
          continue;
        }

        // Lấy mô tả (descr / des / description)
        const descr = (
          row.descr ||
          row.Descr ||
          row.des ||
          row.Des ||
          row.description ||
          row.Description ||
          ''
        ).toString().trim();

        // Kiểm tra trùng tên
        const existing = await SELECT.one.from(Genres).where({ name });

        if (existing) {
          await UPDATE(Genres, existing.ID).with({ descr });
          updated++;
        } else {
          await INSERT.into(Genres).entries({
            ID: nextID++,
            name,
            descr
          });
          inserted++;
        }

      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      message: `Inserted ${inserted}, updated ${updated}. ${errors.length} error(s).`,
      inserted,
      updated,
      errors
    };
  }
};