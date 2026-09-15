const cds = require('@sap/cds')

module.exports = class AdminService extends cds.ApplicationService {

  async init() {

    this.on('getBooksFromRAP', async (req) => {
      try {
        const { Books, Authors, Genres } = cds.entities('sap.capire.bookshop')

        // 1. Lấy dữ liệu từ RAP
        const rap = await cds.connect.to('ZUI_BOOK')
        const booksFromRAP = await rap.run(SELECT.from('Book'))

        if (!booksFromRAP || booksFromRAP.length === 0) {
          return {
            success: false,
            message: 'Không lấy được sách nào từ RAP',
            inserted: 0,
            errors: []
          }
        }

        console.log('Số lượng sách từ RAP:', booksFromRAP.length)

        // 2. Lấy danh sách Author & Genre hiện có để map nhanh
        const allAuthors = await SELECT.from(Authors).columns('ID', 'name')
        const allGenres  = await SELECT.from(Genres).columns('ID', 'name')

        const authorMap = {}
        allAuthors.forEach(a => {
          if (a.name) authorMap[a.name.toLowerCase().trim()] = a.ID
        })

        const genreMap = {}
        allGenres.forEach(g => {
          if (g.name) genreMap[g.name.toLowerCase().trim()] = g.ID
        })

        const booksToInsert = []
        const errors = []

        // 3. Xử lý từng cuốn sách
        for (const [index, b] of booksFromRAP.entries()) {
          try {
            const title = (b.title || '').toString().trim()

            if (!title) {
              errors.push(`Book ${index + 1}: Thiếu title`)
              continue
            }

            const authorName = (b.author_name || '').toString().trim()
            const genreName  = (b.genre_name || '').toString().trim()
            const descr = (b.descr || b.description || b.Descript || '').toString().trim()

            // ----- Xử lý Author -----
            let author_ID = authorMap[authorName.toLowerCase()]

            if (authorName && !author_ID) {
              // Tạo Author mới
              await INSERT.into(Authors).entries({ name: authorName })
              const createdAuthor = await SELECT.one.from(Authors).where({ name: authorName })
              author_ID = createdAuthor?.ID
              if (author_ID) {
                authorMap[authorName.toLowerCase()] = author_ID
              }
            }

            // ----- Xử lý Genre -----
            let genre_ID = null
            if (genreName) {
              genre_ID = genreMap[genreName.toLowerCase()]
            }

            if (!genre_ID) {
              errors.push(`Dòng ${index + 1} - "${title}": Genre "${genreName || 'trống'}" không tồn tại → bỏ qua`)
              continue   
            }



            // ----- Chuẩn bị dữ liệu insert -----
            booksToInsert.push({
              title: title,
              descr: descr,
              stock: Number(b.stock) || 0,
              price: Number(b.price) || 0,
              currency_code: (b.currency_code || 'USD').toString().toUpperCase(),
              author_ID: author_ID || null,
              genre_ID: genre_ID || null
            })

          } catch (err) {
            errors.push(`Book ${index + 1}: ${err.message}`)
          }
        }

        // 4. Insert hàng loạt
        let inserted = 0
        if (booksToInsert.length > 0) {
          await INSERT.into(Books).entries(booksToInsert)
          inserted = booksToInsert.length
        }

        // 5. Tạo message trả về cho popup
        let message = `Đã insert thành công ${inserted} sách từ RAP.`
        if (errors.length > 0) {
          message += `\n\nCó ${errors.length} dòng bị bỏ qua:\n` + errors.join('\n')
        }

        console.log(message)
          return message


      } catch (err) {
        console.error('getBooksFromRAP error:', err)
        return {
          success: false,
          message: err.message || 'Lỗi không xác định',
          inserted: 0,
          errors: [err.message]
        }
      }
    })

    return super.init()
  }
}