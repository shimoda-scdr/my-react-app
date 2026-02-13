// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient'; // 接続設定読み込み

// 各ページ
import Home from './Home';
import EditBook from './EditBook';
import Login from './Login'; // ★追加
import BookDetail from './BookDetail';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. 初回起動時にログイン状態を取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. ログイン/ログアウトの変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ★ログインしていなければ、強制的にログイン画面を表示
  if (!session) {
    return <Login />;
  }

  // ★ログインしていれば、いつものアプリを表示
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edit/:id" element={<EditBook />} />
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;