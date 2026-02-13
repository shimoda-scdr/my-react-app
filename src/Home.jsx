// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, SimpleGrid, Image, Text, Card, CardBody,
  Textarea, HStack, Spacer // Spacerを追加
} from '@chakra-ui/react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [score, setScore] = useState('');
  const [file, setFile] = useState(null);
  const [books, setBooks] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [username, setUsername] = useState('');
  const toast = useToast();

  const fetchBooks = async (searchWord = '') => {
    let query = supabase.from('books').select('*').order('created_at', { ascending: false });
    if (searchWord) {
      query = query.ilike('title', `%${searchWord}%`);
    }
    const { data, error } = await query;
    if (!error) { setBooks(data); }
  };

useEffect(() => {
    fetchBooks();

    // ▼ プロフィールを取得する処理を追加
    const fetchUserProfile = async () => {
      // 1. 今ログインしているユーザーの基本情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. そのユーザーのIDを使って、profilesテーブルからusernameを探す
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        // 3. 見つかったら箱（State）に入れる
        if (data && data.username) {
          setUsername(data.username);
        }
      }
    };

    fetchUserProfile();
  }, []);

  // ★ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRegister = async (e) => {
    // ... (ここは前のまま変更なし) ...
    e.preventDefault();
    if (!file || !title) {
        // ... (省略)
        return;
    }
    try {
        // ... (省略: 登録処理の中身はそのまま) ...
        setLoading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('books').insert([{ 
            title, cover_url: urlData.publicUrl, score, review 
        }]);
        if (dbError) throw dbError;
        toast({ title: '成功', status: 'success', duration: 3000, isClosable: true });
        setTitle(''); setReview(''); setScore(''); setFile(null);
        fetchBooks();
    } catch (error) {
        console.error(error);
        toast({ title: 'エラー', description: error.message, status: 'error', isClosable: true });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        
        {/* ★ヘッダーエリア（ログアウトボタンを追加） */}
        <HStack>
            <Heading as="h1" size="lg">同人誌レビュー</Heading>
            <Spacer />
            {username && (
              <Text fontWeight="bold" mr={4}>
                {username}さん
              </Text>
            )}
            <Button colorScheme="red" variant="outline" size="sm" onClick={handleLogout}>
                ログアウト
            </Button>
        </HStack>

        <Box>
          <Box as="form" onSubmit={handleRegister} p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
             {/* ... (フォームの中身はそのまま変更なし) ... */}
             <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>本のタイトル</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>表紙画像</FormLabel>
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} p={1} />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>登録する</Button>
            </VStack>
          </Box>
        </Box>

        <HStack>
          <Input placeholder="タイトルで検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button onClick={() => fetchBooks(keyword)}>検索</Button>
        </HStack>

        <Box textAlign="left">
          <Heading size="lg" mb={4}>登録済みリスト ({books.length}冊)</Heading>
          <SimpleGrid columns={[2, 3]} spacing={5}>
            {books.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} state={{ book }}>
                <Card overflow="hidden" variant="outline" cursor="pointer" _hover={{ boxShadow: "lg" }}>
                  <Image src={book.cover_url} alt={book.title} objectFit="cover" height="200px" width="100%" />
                  <CardBody p={3}>
                    <Text fontWeight="bold" noOfLines={1}>{book.title}</Text>
                    <HStack spacing={2} mb={1}>
                      <Text fontSize="sm" color="gray.500">Score:</Text>
                      <Text fontWeight="bold" color="blue.500">{book.score ? `${book.score}点` : '-'}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                      {book.review}
                    </Text>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
}