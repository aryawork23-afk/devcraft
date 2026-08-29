import './App.css'

const sampleOrders = [
  {
    id: 'ORD-1001',
    customer: 'Meena aunty',
    item: '2 navy blue kurta',
    due: 'Today',
    amount: 1200,
    status: 'Pending',
  },
  {
    id: 'ORD-1002',
    customer: 'Rakesh',
    item: '1 chocolate cake',
    due: 'Tomorrow',
    amount: 850,
    status: 'In progress',
  },
]

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">ORDER MANAGER</p>
          <h1>DevCraft</h1>
        </div>

        <div className="online-status">
          <span className="status-dot"></span>
          Online
        </div>
      </header>

      <main>
        <section className="welcome">
          <p>Good morning</p>
          <h2>Here is today&apos;s work</h2>
        </section>

        <section className="summary-grid">
          <article className="summary-card urgent">
            <span>Due today</span>
            <strong>1</strong>
          </article>

          <article className="summary-card">
            <span>Overdue</span>
            <strong>0</strong>
          </article>

          <article className="summary-card">
            <span>Unpaid</span>
            <strong>₹2,050</strong>
          </article>

          <article className="summary-card">
            <span>This week</span>
            <strong>7 items</strong>
          </article>
        </section>

        <button className="new-order-button">
          <span className="plus">+</span>
          Add order from message
        </button>

        <section className="orders-section">
          <div className="section-heading">
            <h2>Recent orders</h2>
            <button className="text-button">View all</button>
          </div>

          <div className="order-list">
            {sampleOrders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-top">
                  <div>
                    <p className="order-id">{order.id}</p>
                    <h3>{order.customer}</h3>
                  </div>

                  <span className="status-badge">{order.status}</span>
                </div>

                <p className="item-description">{order.item}</p>

                <div className="order-bottom">
                  <span>Due: {order.due}</span>
                  <strong>₹{order.amount}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <nav className="bottom-navigation">
        <button className="nav-item active">
          <span>⌂</span>
          Home
        </button>

        <button className="nav-item">
          <span>▤</span>
          Orders
        </button>

        <button className="nav-item">
          <span>♙</span>
          Customers
        </button>

        <button className="nav-item">
          <span>⚙</span>
          Settings
        </button>
      </nav>
    </div>
  )
}

export default App