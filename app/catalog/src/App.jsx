import { useState, useEffect, useMemo } from 'react'
import './App.css'

// const SERVICE = 'browse'   

function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [orderMsg, setOrderMsg] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [search, setSearch] = useState('')

  // ===== Load Books =====
  // const loadBooks = async () => {
  //   setLoading(true)
  //   setError(null)
  //   try {
  //     const res = await fetch(`${SERVICE}/Books?$orderby=title`)
  //     if (!res.ok) throw new Error('Không tải được dữ liệu')
  //     const data = await res.json()
  //     setBooks(data.value || [])
  //   } catch (err) {
  //     setError(err.message)
  //   } finally {
  //     setLoading(false)
  //   }
  // }  


    const loadBooks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/browse/Books?$orderby=title')
      
      console.log('Status:', res.status)          // ← xem status
      console.log('URL:', res.url)                // ← xem URL thực tế

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Lỗi ${res.status}: ${text}`)
      }

      const data = await res.json()
      setBooks(data.value || [])
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])

  // ===== Filter =====
  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books
    const q = search.toLowerCase()
    return books.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.genre?.toLowerCase().includes(q)
    )
  }, [books, search])

  // ===== Đặt hàng =====
  const handleOrder = async () => {
    if (!selectedBook || quantity < 1) return

    setOrdering(true)
    setOrderMsg('')

    try {
      const res = await fetch(`/browse/submitOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          book: selectedBook.ID,
          quantity: Number(quantity)
        })
      })

      if (res.ok) {
        setOrderMsg(`✅ Đặt thành công ${quantity} cuốn "${selectedBook.title}"`)
        // Cập nhật stock local
        setBooks(prev =>
          prev.map(b =>
            b.ID === selectedBook.ID
              ? { ...b, stock: b.stock - Number(quantity) }
              : b
          )
        )
        setSelectedBook(prev => ({
          ...prev,
          stock: prev.stock - Number(quantity)
        }))
        setQuantity(1)
      } else {
        const err = await res.json()
        setOrderMsg(`❌ ${err.error?.message || 'Đặt hàng thất bại'}`)
      }
    } catch (e) {
      setOrderMsg('❌ Lỗi kết nối server')
    } finally {
      setOrdering(false)
    }
  }

  // ===== Render =====
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div>
          <h1>Bookshop Catalog</h1>
          <p>React + CAP CatalogService</p>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm theo tên, tác giả, thể loại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {loading && <div className="loading">Đang tải sách...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="layout">
          {/* ===== Danh sách ===== */}
          <section className="list-section">
            <div className="section-header">
              <h2>Danh sách sách ({filteredBooks.length})</h2>
              <button className="btn-refresh" onClick={loadBooks}>
                Làm mới
              </button>
            </div>

            <div className="book-grid">
              {filteredBooks.map(book => (
                <div
                  key={book.ID}
                  className={`book-card ${selectedBook?.ID === book.ID ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedBook(book)
                    setOrderMsg('')
                    setQuantity(1)
                  }}
                >
                  <div className="book-title">{book.title}</div>
                  <div className="book-author">{book.author || '—'}</div>
                  <div className="book-genre">{book.genre || '—'}</div>

                  <div className="book-footer">
                    <span className={`stock ${book.stock < 20 ? 'low' : ''}`}>
                      Còn {book.stock}
                    </span>
                    <span className="price">
                      {book.price} {book.currency_code || 'USD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="empty">Không tìm thấy sách nào</div>
            )}
          </section>

          {/* ===== Chi tiết + Đặt hàng ===== */}
          <aside className="detail-section">
            {selectedBook ? (
              <div className="detail-card">
                <h2>Chi tiết</h2>
                <h3>{selectedBook.title}</h3>

                <div className="detail-row">
                  <span>Tác giả</span>
                  <strong>{selectedBook.author || '—'}</strong>
                </div>
                <div className="detail-row">
                  <span>Thể loại</span>
                  <strong>{selectedBook.genre || '—'}</strong>
                </div>
                <div className="detail-row">
                  <span>Tồn kho</span>
                  <strong className={selectedBook.stock < 20 ? 'low' : ''}>
                    {selectedBook.stock}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Giá</span>
                  <strong>
                    {selectedBook.price} {selectedBook.currency_code || 'USD'}
                  </strong>
                </div>

                {selectedBook.descr && (
                  <div className="descr">
                    <p>{selectedBook.descr}</p>
                  </div>
                )}

                <div className="order-box">
                  <label>
                    Số lượng
                    <input
                      type="number"
                      min="1"
                      max={selectedBook.stock}
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </label>

                  <button
                    className="btn-order"
                    onClick={handleOrder}
                    disabled={ordering || quantity > selectedBook.stock || quantity < 1}
                  >
                    {ordering ? 'Đang đặt...' : 'Đặt hàng'}
                  </button>
                </div>

                {orderMsg && (
                  <div className={`order-msg ${orderMsg.startsWith('✅') ? 'success' : 'error'}`}>
                    {orderMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-select">
                <p>← Chọn một cuốn sách để xem chi tiết và đặt hàng</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default App