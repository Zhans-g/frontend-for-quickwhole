import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState(null);

  const fetchProducts = () => {
    axios.get('https://backend-for-quickwhole.onrender.com/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Ошибка загрузки товаров:", err));
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        const config = { headers: { 'Authorization': `Bearer ${savedUser?.token}` } };
        
        await axios.delete(`https://backend-for-quickwhole.onrender.com/api/products/${id}`, config);
        alert("Товар удален");
        fetchProducts();
      } catch (err) {
        console.error("Ошибка удаления:", err);
        alert("Не удалось удалить товар. Проверьте права доступа.");
      }
    }
  };

  useEffect(() => {
    fetchProducts();
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

  // 1. Создаем индикатор загрузки, чтобы пользователь понимал, что процесс идет
  const btn = document.querySelector('button[style*="background: rgb(37, 211, 102)"]');
  if (btn) btn.innerText = "Оформление...";

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
      // 2. Вместо window.open пробуем window.location.href, это надежнее для мобилок
      window.location.href = res.data.url; 
    }
  } catch (err) {
    console.error("Ошибка:", err.response?.data || err.message);
    alert("Ошибка связи с сервером. Попробуйте еще раз через минуту.");
  } finally {
    if (btn) btn.innerText = "Заказать в WhatsApp";
  }
};

  return (
    <div style={styles.appWrapper}>
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={onLoginSuccess} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} onProductAdded={fetchProducts} />

      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <h1 style={styles.logo}>QuickWhole</h1>
          <div style={styles.headerActions}>
            <button onClick={() => setIsCartOpen(true)} style={styles.cartBtn}>
              Корзина {cart.length > 0 && `(${cart.reduce((a, b) => a + b.quantity, 0)})`}
            </button>
            {user ? (
              <button onClick={() => setIsProfileOpen(true)} style={styles.userBtn}>{user.username}</button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} style={styles.loginBtn}>Войти</button>
            )}
          </div>
        </div>
      </header>

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
                <button onClick={() => addToCart(product)} style={styles.addToCartBtn}>В корзину</button>
                
                {user && user.role === 'admin' && (
                  <button onClick={() => deleteProduct(product._id)} style={styles.deleteBtn}>Удалить товар</button>
                )}
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
                      <button onClick={() => updateQuantity(item._id, -1, item.minOrder)} style={styles.qtyBtn}>-</button>
                      <span style={styles.qtyValue}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1, item.minOrder)} style={styles.qtyBtn}>+</button>
                    </div>
                  </div>
                ))}
                <div style={styles.cartFooter}>
                  <h3 style={styles.totalText}>Итого: <span>{totalPrice.toLocaleString()} ₸</span></h3>
                  <div style={styles.cartActions}>
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
              <h2>{user.username}</h2>
              <div style={{borderTop: '1px solid #eee', paddingTop: '10px'}}>
                {user.role === 'admin' && (
                  <button onClick={() => { setIsAdminOpen(true); setIsProfileOpen(false); }} style={styles.adminActionBtn}>⚙️ Панель админа</button>
                )}
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
  appWrapper: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' },
  header: { background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, padding: '12px 0' },
  headerContainer: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px' },
  logo: { color: '#e62e04', margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-1px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  cartBtn: { background: '#e62e04', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  loginBtn: { background: '#fff', border: '1.5px solid #e62e04', color: '#e62e04', padding: '7px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  userBtn: { background: '#f0f0f0', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  main: { maxWidth: '1200px', margin: '20px auto', padding: '0 15px' },
  sectionTitle: { fontSize: '20px', marginBottom: '20px', fontWeight: 'bold' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  productCard: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eee' },
  productImage: { width: '100%', height: '250px', objectFit: 'cover' },
  productInfo: { padding: '15px' },
  productName: { fontSize: '16px', margin: '0 0 8px 0', fontWeight: '600', color: '#333' },
  productPrice: { fontSize: '22px', color: '#e62e04', fontWeight: '800', margin: '0 0 5px 0' },
  minOrder: { fontSize: '13px', color: '#888', marginBottom: '15px' },
  addToCartBtn: { width: '100%', padding: '14px', background: '#e62e04', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  deleteBtn: { width: '100%', marginTop: '10px', padding: '8px', background: 'none', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000 },
  cartModal: { background: '#fff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' },
  profileModal: { background: '#fff', width: '320px', borderRadius: '20px', position: 'relative', marginBottom: 'auto', marginTop: '100px' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f0f0f0', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f5f5f5' },
  cartItemImg: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f5f5f5', padding: '5px 10px', borderRadius: '10px' },
  qtyBtn: { border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', width: '25px' },
  qtyValue: { fontWeight: 'bold', minWidth: '20px', textAlign: 'center' },
  payBtn: { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#25D366', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  adminActionBtn: { width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' },
  logoutFullBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#ff4d4f', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;