import React, { useState } from 'react';
import axios from 'axios';

function AdminPanel({ isOpen, onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '', price: '', imageUrl: '', minOrder: 5
  });

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Достаем токен из localStorage
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const token = savedUser ? savedUser.token : null;

    const config = {
      headers: {
        'Authorization': `Bearer ${token}` // Передаем токен серверу
      }
    };

    await axios.post('http://localhost:5001/api/products', formData, config);
    
    alert("Товар успешно добавлен!");
    onProductAdded(); 
    onClose();
  } catch (err) {
    console.error("Ошибка при добавлении:", err.response?.data || err.message);
    alert("Ошибка при добавлении. Проверь консоль сервера.");
  }
};

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        <h2>Добавить новый товар</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input type="text" placeholder="Название товара" required 
            onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="number" placeholder="Цена (₸)" required 
            onChange={e => setFormData({...formData, price: e.target.value})} />
          <input type="text" placeholder="Ссылка на фото (URL)" required 
            onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          <input type="number" placeholder="Мин. заказ (шт)" required defaultValue={5}
            onChange={e => setFormData({...formData, minOrder: e.target.value})} />
          <button type="submit" style={styles.submitBtn}>Опубликовать</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modal: { background: '#fff', padding: '30px', borderRadius: '15px', width: '400px', position: 'relative' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' },
  submitBtn: { padding: '12px', background: '#e62e04', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  closeBtn: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }
};

export default AdminPanel;