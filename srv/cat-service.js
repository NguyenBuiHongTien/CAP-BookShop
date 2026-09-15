const cds = require('@sap/cds')
const { Books } = cds.entities('sap.capire.bookshop')

class CatalogService extends cds.ApplicationService {

  init() {
    // After READ: thêm thông báo giảm giá nếu stock > 111
    this.after('READ', 'Books', (books) => {
      for (const book of books) {
        if (book.stock > 111) {
          book.title += ' -- 11% discount!'
        }
      }
    })

    // Action submitOrder: trừ tồn kho
    this.on('submitOrder', async (req) => {
      const { book: id, quantity } = req.data

      const affected = await UPDATE(Books, id)
        .with({ stock: { '-=': quantity } })
        .where({ stock: { '>=': quantity } })

      if (affected === 0) {
        return req.error(409, `Không đủ hàng cho sách #${id}`)
      }
    })

    return super.init()
  }


  
}

module.exports = CatalogService