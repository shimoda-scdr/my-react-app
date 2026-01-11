// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 作成した2つのページを読み込む
import Home from './Home';
import EditBook from './EditBook';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* URLが "/" の時は Home を表示 */}
        <Route path="/" element={<Home />} />
        
        {/* URLが "/edit/123" などの時は EditBook を表示 */}
        <Route path="/edit/:id" element={<EditBook />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;