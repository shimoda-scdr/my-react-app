// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, SimpleGrid, Image, Text, Card, CardBody, HStack, Spacer, Collapse
} from '@chakra-ui/react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [books, setBooks] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [username, setUsername] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const toast = useToast();

  // ★追加：ページネーション用のStateと設定
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // 1ページに表示する件数

  const fetchBooks = async (searchWord = '') => {
    let query = supabase
      .from('books')
      .select('*, reviews(score)') 
      .order('created_at', { ascending: false });
      
    if (searchWord) {
      query = query.ilike('title', `%${searchWord}%`);
    }
    
    const { data, error } = await query;
    if (!error) { 
      setBooks(data); 
      setCurrentPage(1); // ★検索したりデータを取り直した時は、必ず1ページ目に戻す
    }
  };

  useEffect(() => {
    fetchBooks();

    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (data && data.username) {
          setUsername(data.username);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!file || !title) {
        toast({ title: 'エラー', description: 'タイトルと画像を入力してください', status: 'error', isClosable: true });
        return;
    }
    try {
        setLoading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('books').insert([{ 
            title, cover_url: urlData.publicUrl 
        }]);
        
        if (dbError) throw dbError;
        
        toast({ title: '成功', description: '本を登録しました', status: 'success', duration: 3000, isClosable: true });
        setTitle(''); setFile(null);
        setIsFormOpen(false);
        fetchBooks();
    } catch (error) {
        console.error(error);
        toast({ title: 'エラー', description: error.message, status: 'error', isClosable: true });
    } finally {
        setLoading(false);
    }
  };

  const getAverageScore = (reviews) => {
    if (!reviews || reviews.length === 0) return '-'; 
    const total = reviews.reduce((sum, rev) => sum + rev.score, 0); 
    return Math.round(total / reviews.length); 
  };

  // ==========================================
  // ★追加：表示するデータを計算する
  // ==========================================
  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE); // 全体のページ数を計算
  
  // 表示する最初の位置と最後の位置を計算して切り取る (slice)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBooks = books.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        
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
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)} 
            colorScheme="blue" 
            variant="outline" 
            width="full" 
            mb={4}
          >
            {isFormOpen ? '登録フォームを閉じる ▲' : '新しい本を登録する ▼'}
          </Button>

          <Collapse in={isFormOpen} animateOpacity>
            <Box as="form" onSubmit={handleRegister} p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
               <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>本のタイトル</FormLabel>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>表紙画像</FormLabel>
                  <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} p={1} />
                </FormControl>
                <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>本を登録する</Button>
              </VStack>
            </Box>
          </Collapse>
        </Box>

        <HStack>
          <Input placeholder="タイトルで検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button onClick={() => fetchBooks(keyword)}>検索</Button>
        </HStack>

        <Box textAlign="left">
          <Heading size="lg" mb={4}>登録済みリスト ({books.length}冊)</Heading>
          <SimpleGrid columns={[2, 3]} spacing={5}>
            {/* ★修正: 全てのbooksではなく、切り取った currentBooks を表示する */}
            {currentBooks.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} state={{ book }}>
                <Card overflow="hidden" variant="outline" cursor="pointer" _hover={{ boxShadow: "lg" }}>
                  <Image src={book.cover_url} alt={book.title} objectFit="cover" height="200px" width="100%" />
                  <CardBody p={3}>
                    <Text fontWeight="bold" noOfLines={1} mb={2}>{book.title}</Text>
                    
                    <HStack spacing={2} mb={1}>
                      <Text fontSize="sm" color="gray.500">平均点:</Text>
                      <Text fontWeight="bold" color="blue.500">
                        {getAverageScore(book.reviews)} {book.reviews?.length > 0 && '点'}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      レビュー数: {book.reviews ? book.reviews.length : 0}件
                    </Text>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        </Box>


        {/* ==========================================
            ★変更：ページ切り替えボタン（数字ボタン付き）
        ========================================== */}
        {totalPages > 0 && (
          <HStack justify="center" pt={6} pb={8} spacing={2} wrap="wrap">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              isDisabled={currentPage === 1}
              size="sm"
            >
              前へ
            </Button>
            
            {/* ★ここが数字ボタンを自動生成する仕組みです */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <Button
                key={number}
                onClick={() => setCurrentPage(number)}
                // 現在のページだけ色を青く（目立たせる）し、他はグレーのアウトラインにする
                colorScheme={currentPage === number ? "blue" : "gray"}
                variant={currentPage === number ? "solid" : "outline"}
                size="sm"
                w="10" // ボタンの幅を揃えて綺麗な四角にする
              >
                {number}
              </Button>
            ))}
            
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              isDisabled={currentPage === totalPages}
              size="sm"
            >
              次へ
            </Button>
          </HStack>
        )}

      </VStack>
    </Container>
  );
}