// src/Login.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Text, Link 
} from '@chakra-ui/react';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true); // ★ログイン画面か登録画面かを切り替えるスイッチ
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // ★追加: ユーザーネーム用
  const toast = useToast();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLoginMode) {
      // ===================================
      // ▼ ログインの処理
      // ===================================
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'ログイン失敗', description: error.message, status: 'error' });
      }
      
    } else {
      // ===================================
      // ▼ 新規登録の処理
      // ===================================
      if (!username) {
        toast({ title: 'エラー', description: 'ユーザーネームを入力してください', status: 'error' });
        setLoading(false);
        return;
      }

      // 1. まずメールとパスワードでアカウントを作成
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        toast({ title: '登録失敗', description: error.message, status: 'error' });
      } else if (data.user) {
        // 2. 作成に成功したら、さっき作った「profiles」テーブルに名前と権限を書き込む
        const { error: dbError } = await supabase.from('profiles').insert([
          { 
            id: data.user.id,     // 認証データと同じIDを持たせる
            username: username,   // 入力された名前
            role: 'user'          // 最初は全員「通常ユーザー」にする
          }
        ]);

        if (dbError) {
          toast({ title: 'プロフィール作成失敗', description: dbError.message, status: 'error' });
        } else {
          toast({ title: '登録成功！', description: 'ログインしてください', status: 'success' });
          setIsLoginMode(true); // 成功したらログイン画面に切り替える
          setPassword('');      // パスワード欄を空にする
        }
      }
    }
    setLoading(false);
  };

  return (
    <Container maxW="container.sm" py={20}>
      <VStack spacing={8}>
        <Heading>{isLoginMode ? 'ログイン' : '新規登録'}</Heading>
        
        <Box as="form" onSubmit={handleAuth} w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white">
          <VStack spacing={4}>
            
            {/* ★ 新規登録の時だけ、ユーザーネームの入力欄を表示する */}
            {!isLoginMode && (
              <FormControl isRequired>
                <FormLabel>ユーザーネーム</FormLabel>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="例：サトウ" />
              </FormControl>
            )}

            <FormControl isRequired>
              <FormLabel>メールアドレス</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>パスワード</FormLabel>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormControl>
            
            <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
              {isLoginMode ? 'ログインする' : '登録する'}
            </Button>
            
            {/* ★ モード切り替え用のリンク */}
            <Text fontSize="sm" color="gray.500" mt={4}>
              {isLoginMode ? "アカウントを持っていませんか？ " : "すでにアカウントを持っていますか？ "}
              <Link color="blue.500" onClick={() => setIsLoginMode(!isLoginMode)}>
                {isLoginMode ? "新規登録はこちら" : "ログイン画面に戻る"}
              </Link>
            </Text>

          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}