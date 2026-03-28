import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); // Переключение между Входом и Регистрацией
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin 
      ? 'https://backend-for-quickwhole.onrender.com/api/auth/login' 
      : 'https://backend-for-quickwhole.onrender.com/api/auth/register';

    try {
      const res = await axios.post(url, formData);
      localStorage.setItem('token', res.data.token); // Сохраняем токен
      alert(isLogin ? "Вы вошли!" : "Регистрация успешна!");
      onLoginSuccess(res.data.user); // Передаем данные пользователя в App.js
      onClose();
    } catch (err) {
      alert(err.response?.data?.msg || "Ошибка авторизации");
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <button onClick={onClose} style={closeBtn}>✕</button>
        <h2 style={{ textAlign: 'center', color: '#e62e04' }}>
          {isLogin ? 'Вход в QuickWhole' : 'Регистрация'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <input 
              type="text" placeholder="Имя пользователя" required
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              style={inputStyle}
            />
          )}
          <input 
            type="email" placeholder="Email" required
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={inputStyle}
          />
          <input 
            type="password" placeholder="Пароль" required
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={inputStyle}
          />
          <button type="submit" style={submitBtn}>
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'} 
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: '#e62e04', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </p>
      </div>
    </div>
  );
};

// Стили (в объектах для чистого CSS)
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: '#fff', padding: '30px', borderRadius: '15px', width: '350px', position: 'relative' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' };
const submitBtn = { padding: '12px', background: '#e62e04', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const closeBtn = { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' };

export default Auth;