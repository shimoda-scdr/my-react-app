// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link ,useLocation} from 'react-router-dom';
import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, SimpleGrid, Image, Text, Card, CardBody, HStack, Spacer, Collapse, Select,
  Spinner, Center, Tag, Wrap, WrapItem
} from '@chakra-ui/react';
import imageCompression from 'browser-image-compression';

export default function Home() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [tagsInput, setTagsInput] = useState('');

  const [books, setBooks] = useState([]);
  const [keyword, setKeyword] = useState(location.state?.searchTag || '');
  
  const [username, setUsername] = useState(localStorage.getItem('my_username') || '');
  const [userId, setUserId] = useState(localStorage.getItem('my_userId') || null);
  const [currentUserRole, setCurrentUserRole] = useState(localStorage.getItem('my_role') || 'user'); 
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const toast = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; 
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchBooks = async (searchWord = '') => {
    setIsFetching(true); 
    let query = supabase
      .from('books')
      .select('*, reviews(score)') 
      .order('created_at', { ascending: false });
      
    if (searchWord) {
      // ★変更：タイトルに部分一致するか、タグに完全一致するか（or条件）を検索する
      query = query.or(`title.ilike.%${searchWord}%,tags.cs.{"${searchWord}"}`);
    }
    
    const { data, error } = await query;
    if (!error) { 
      setBooks(data); 
      setCurrentPage(1); 
    }
    setIsFetching(false); 
  };

  useEffect(() => {
    const initialSearchWord = location.state?.searchTag || '';
    fetchBooks(initialSearchWord);
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        localStorage.setItem('my_userId', user.id);
        const { data } = await supabase.from('profiles').select('username, role').eq('id', user.id).single();
        if (data) {
          if (data.username) {
            setUsername(data.username);
            localStorage.setItem('my_username', data.username);
          }
          if (data.role) {
            setCurrentUserRole(data.role);
            localStorage.setItem('my_role', data.role);
          }
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('my_username');
    localStorage.removeItem('my_userId');
    localStorage.removeItem('my_role');
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

        const tagsArray = tagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag !== '');

        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, compressedFile);
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('books').insert([{ 
            title, 
            cover_url: urlData.publicUrl,
            tags: tagsArray
        }]);
        
        if (dbError) throw dbError;
        
        toast({ title: '成功', description: '本を登録しました', status: 'success', duration: 3000, isClosable: true });
        setTitle(''); 
        setFile(null);
        setTagsInput(''); 
        setIsFormOpen(false);
        fetchBooks();
    } catch (error) {
        console.error(error);
        toast({ title: 'エラー', description: error.message, status: 'error', isClosable: true });
    } finally {
        setLoading(false);
    }
  };

  // ★追加：タグをクリックした時の処理
  const handleTagClick = (tag, e) => {
    e.preventDefault(); // クリックした時に詳細画面へ飛んでしまう（Link）のを防ぐ
    e.stopPropagation(); // 親要素へのクリックイベントの伝播を止める
    setKeyword(tag); // 検索窓にタグの文字を自動でセットする
    fetchBooks(tag); // 検索を実行する
  };

  const getAverageScore = (reviews) => {
    if (!reviews || reviews.length === 0) return '-'; 
    const total = reviews.reduce((sum, rev) => sum + rev.score, 0); 
    return Math.round(total / reviews.length); 
  };

  const sortedBooks = [...books].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortOrder === 'reviews') return (b.reviews ? b.reviews.length : 0) - (a.reviews ? a.reviews.length : 0);
    return 0;
  });

  const totalPages = Math.ceil(sortedBooks.length / ITEMS_PER_PAGE); 
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBooks = sortedBooks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack>
            <Heading as="h1" size="lg">同人誌レビュー</Heading>
            <Spacer />
            {username && (
              <Link to={`/profile/${userId}`} state={{ username }}>
                <Text fontWeight="bold" mr={4} color={currentUserRole === 'admin' ? "red.600" : "blue.600"} _hover={{ textDecoration: 'underline' }}>
                  {username}さん {currentUserRole === 'admin' && " (管理者)"}
                </Text>
              </Link>
            )}
            <Button colorScheme="gray" variant="outline" size="sm" onClick={handleLogout}>ログアウト</Button>
        </HStack>

        {currentUserRole === 'admin' && (
          <Box>
            <Button onClick={() => setIsFormOpen(!isFormOpen)} colorScheme="blue" variant="outline" width="full" mb={4}>
              {isFormOpen ? '登録フォームを閉じる ▲' : '新しい本を登録する ▼'}
            </Button>
            <Collapse in={isFormOpen} animateOpacity>
              <Box as="form" onSubmit={handleRegister} p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
                 <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>本のタイトル</FormLabel>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>タグ（複数付ける場合はカンマ `,` で区切ってください）</FormLabel>
                    <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="例: アクション, 恋愛, SF" />
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
        )}

        <HStack w="full">
          <Input placeholder="タイトル（部分一致）or タグ（全一致）" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button onClick={() => fetchBooks(keyword)}>検索</Button>
          <Select w="200px" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            <option value="newest">新着順</option>
            <option value="reviews">レビューが多い順</option>
          </Select>
        </HStack>

        <Box textAlign="left">
          <Heading size="lg" mb={4}>登録済みリスト {!isFetching && `(${books.length}冊)`}</Heading>
          {isFetching ? (
            <Center py={10}><Spinner size="xl" color="blue.500" thickness="4px" /></Center>
          ) : currentBooks.length === 0 ? (
            <Text color="gray.500">条件に一致する本が見つかりませんでした。</Text>
          ) : (
            <SimpleGrid columns={[2, 3]} spacing={5}>
              {currentBooks.map((book) => (
                <Link key={book.id} to={`/book/${book.id}`} state={{ book }}>
                  <Card overflow="hidden" variant="outline" cursor="pointer" _hover={{ boxShadow: "lg" }}>
                    <Image src={book.cover_url} alt={book.title} loading="lazy" objectFit="cover" height="200px" width="100%" />
                    <CardBody p={3}>
                      <Text fontWeight="bold" noOfLines={1} mb={2}>{book.title}</Text>
                      
                      {/* ★変更：タグをクリックできるようにしました */}
                      {book.tags && book.tags.length > 0 && (
                        <Wrap mb={2} spacing={1}>
                          {book.tags.map((tag, index) => (
                            <WrapItem key={index}>
                              <Tag 
                                size="sm" 
                                colorScheme="teal" 
                                borderRadius="full"
                                cursor="pointer" // カーソルを指のマークにする
                                _hover={{ opacity: 0.7 }} // ホバー時に少し透明にして押せることをアピール
                                onClick={(e) => handleTagClick(tag, e)} // クリックした時の処理
                              >
                                {tag}
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      )}

                      <HStack spacing={2} mb={1}>
                        <Text fontSize="sm" color="gray.500">平均点:</Text>
                        <Text fontWeight="bold" color="blue.500">{getAverageScore(book.reviews)} {book.reviews?.length > 0 && '点'}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">レビュー数: {book.reviews ? book.reviews.length : 0}件</Text>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {!isFetching && totalPages > 0 && (
          <HStack justify="center" pt={6} pb={8} spacing={2} wrap="wrap">
            <Button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} isDisabled={currentPage === 1} size="sm">前へ</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <Button key={number} onClick={() => setCurrentPage(number)} colorScheme={currentPage === number ? "blue" : "gray"} variant={currentPage === number ? "solid" : "outline"} size="sm" w="10">
                {number}
              </Button>
            ))}
            <Button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} isDisabled={currentPage === totalPages} size="sm">次へ</Button>
          </HStack>
        )}
      </VStack>
    </Container>
  );
}