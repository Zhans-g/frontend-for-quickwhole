import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel'; // Не забудь создать этот файл

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Загрузка товаров
  const fetchProducts = () => {
    axios.get('https://backend-for-quickwhole.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Ошибка загрузки товаров:", err));
  };

  useEffect(() => {
    fetchProducts();
    // Проверка сохраненного пользователя в браузере
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const onLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsProfileOpen(false);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      const minQty = product.minOrder || 1;
      setCart([...cart, { ...product, quantity: minQty }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta, minOrder) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        const newQty = item.quantity + delta;
        return newQty >= minOrder ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkoutWhatsApp = async () => {
    if (cart.length === 0) return alert("Корзина пуста!");

    try {
      const orderData = {
        cartItems: cart,
        totalPrice: totalPrice,
        city: "Almaty",
        customerName: user ? user.username : "Гость",
        userId: user ? (user._id || user.id) : null 
      };

      const res = await axios.post('https://backend-for-quickwhole.onrender.com/api/orders', orderData);
      
      if (res.data.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      console.error("Ошибка при оформлении заказа:", err);
      alert("Не удалось создать заказ. Проверь работу сервера.");
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      
      <Auth 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLoginSuccess={onLoginSuccess} 
      />

      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onProductAdded={fetchProducts} 
      />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <h1 style={styles.logo}>QuickWhole</h1>
          <input type="text" placeholder="Поиск товаров для бизнеса..." style={styles.searchInput} />
          
          <div style={styles.headerActions}>
            <button onClick={() => setIsCartOpen(true)} style={styles.cartBtn}>
              🛒 Корзина ({cart.reduce((a, b) => a + b.quantity, 0)})
            </button>
            
            {user ? (
              <button onClick={() => setIsProfileOpen(true)} style={styles.userBtn}>
                👤 {user.username}
              </button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} style={styles.loginBtn}>Войти</button>
            )}
          </div>
        </div>
      </header>

      {/* КАТАЛОГ */}
      <main style={styles.main}>
        <h2 style={styles.sectionTitle}>Популярные товары 🇰🇿</h2>
        <div style={styles.productGrid}>
          {products.map(product => (
            <div key={product._id} style={styles.productCard}>
              <img src={product.imageUrl} alt={product.name} style={styles.productImage} />
              <div style={styles.productInfo}>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.productPrice}>{product.price.toLocaleString()} ₸</p>
                <p style={styles.minOrder}>Мин. заказ: {product.minOrder} шт.</p>
                <button onClick={() => addToCart(product)} style={styles.addToCartBtn}>
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* КАРТОЧКА КОРЗИНЫ */}
      {isCartOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.cartModal}>
            <button onClick={() => setIsCartOpen(false)} style={styles.closeBtn}>✕</button>
            <h2 style={styles.cartTitle}>Ваша корзина</h2>
            
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888' }}>Корзина пока пуста</p>
            ) : (
              <div>
                {cart.map(item => (
                  <div key={item._id} style={styles.cartItem}>
                    <img src={item.imageUrl} style={styles.cartItemImg} alt="" />
                    <div style={{ flex: 1 }}>
                      <h4 style={styles.cartItemName}>{item.name}</h4>
                      <p style={styles.cartItemPrice}>{item.price.toLocaleString()} ₸</p>
                    </div>
                    <div style={styles.qtyControls}>
                      <button 
                        onClick={() => updateQuantity(item._id, -1, item.minOrder)} 
                        style={{
                          ...styles.qtyBtn, 
                          opacity: item.quantity <= item.minOrder ? 0.3 : 1,
                          cursor: item.quantity <= item.minOrder ? 'not-allowed' : 'pointer'
                        }}
                        disabled={item.quantity <= item.minOrder}
                      >-</button>
                      <span style={styles.qtyValue}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1, item.minOrder)} style={styles.qtyBtn}>+</button>
                    </div>
                  </div>
                ))}
                
                <div style={styles.cartFooter}>
                  <h3 style={styles.totalText}>Итого: <span>{totalPrice.toLocaleString()} ₸</span></h3>
                  <div style={styles.cartActions}>
                    <button onClick={() => setCart([])} style={styles.clearBtn}>Очистить корзину</button>
                    <button onClick={checkoutWhatsApp} style={styles.payBtn}>Заказать в WhatsApp</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ОКНО АККАУНТА */}
      {isProfileOpen && user && (
        <div style={styles.modalOverlay}>
          <div style={styles.profileModal}>
            <button onClick={() => setIsProfileOpen(false)} style={styles.closeBtn}>✕</button>
            <div style={{textAlign: 'center', padding: '20px'}}>
              <div style={styles.avatarLarge}>👤</div>
              <h2>{user.username}</h2>
              <p style={{color: '#666', marginBottom: '20px'}}>{user.email}</p>
              
              <div style={{borderTop: '1px solid #eee', paddingTop: '10px'}}>
                {/* КНОПКА АДМИНА */}
                {user.role === 'admin' && (
                  <button 
                    onClick={() => { setIsAdminOpen(true); setIsProfileOpen(false); }} 
                    style={{...styles.profileMenuBtn, color: '#e62e04', fontWeight: 'bold'}}
                  >
                    ⚙️ Панель управления
                  </button>
                )}
                
                <button style={styles.profileMenuBtn}>История заказов</button>
                <button onClick={handleLogout} style={styles.logoutFullBtn}>Выйти из аккаунта</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { background: '#fff', borderBottom: '2px solid #e62e04', position: 'sticky', top: 0, zIndex: 100, padding: '10px 0' },
  headerContainer: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px' },
  logo: { color: '#e62e04', margin: 0, fontSize: '26px', fontWeight: 'bold' },
  searchInput: { flex: 1, margin: '0 20px', padding: '12px 20px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  cartBtn: { background: '#e62e04', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  userBtn: { background: '#f0f0f0', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' },
  loginBtn: { background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  main: { maxWidth: '1200px', margin: '30px auto', padding: '0 15px' },
  sectionTitle: { fontSize: '22px', marginBottom: '20px' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  productCard: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' },
  productImage: { width: '100%', height: '180px', objectFit: 'cover' },
  productInfo: { padding: '15px' },
  productName: { fontSize: '15px', margin: '0 0 10px 0', height: '40px' },
  productPrice: { fontSize: '20px', color: '#e62e04', fontWeight: 'bold' },
  minOrder: { fontSize: '12px', color: '#777', margin: '5px 0 15px 0' },
  addToCartBtn: { width: '100%', padding: '12px', background: '#e62e04', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  cartModal: { background: '#fff', width: '90%', maxWidth: '450px', borderRadius: '20px', padding: '25px', position: 'relative' },
  profileModal: { background: '#fff', width: '350px', borderRadius: '15px', position: 'relative', overflow: 'hidden' },
  closeBtn: { position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' },
  cartTitle: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f5f5f5' },
  cartItemImg: { width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '10px' },
  qtyBtn: { width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff' },
  cartFooter: { marginTop: '20px' },
  totalText: { textAlign: 'right', fontSize: '20px' },
  cartActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' },
  clearBtn: { padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', background: '#f0f0f0', cursor: 'pointer' },
  payBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#25D366', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  avatarLarge: { fontSize: '50px', background: '#f0f0f0', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  profileMenuBtn: { width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' },
  logoutFullBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#e62e04', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};

export default App;