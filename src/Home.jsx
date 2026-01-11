// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; // ★リンク機能を追加
import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, SimpleGrid, Image, Text, Card, CardBody
} from '@chakra-ui/react';

// ▼ Supabaseの設定 (App.jsxと同じもの)

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [books, setBooks] = useState([]);
  const toast = useToast();

    const fetchBooks = async () => {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) { setBooks(data); }
    };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!file || !title) {
       try {
        setLoading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, file);
        if (uploadError) { throw uploadError; }

        const { data: urlData} = supabase.storage.from('covers').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('books').insert([{ title, cover_url: urlData.publicUrl }]);
        if (dbError) { throw dbError; }

        toast({
          title: '成功',
          description: '同人誌が登録されました。',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
        setTitle('');
        setFile(null);
        fetchBooks();
    } catch (error) {
        toast({
            title: 'エラー',
            description: error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
        });
    } finally {
        setLoading(false);
    }
  };

    return (
        <Container maxW="container.md" py={8}>
      <VStack spacing={10} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={6} textAlign="center">同人誌登録</Heading>
          <Box as="form" onSubmit={handleRegister} p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white">
            <VStack spacing={4}>
              <FormControl isRequired><FormLabel>本のタイトル</FormLabel><Input value={title} onChange={(e) => setTitle(e.target.value)} /></FormControl>
              <FormControl isRequired><FormLabel>表紙画像</FormLabel><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} p={1} /></FormControl>
              <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>登録する</Button>
            </VStack>
          </Box>
        </Box>

        <Box>
          <Heading size="lg" mb={4}>登録済みリスト ({books.length}冊)</Heading>
          <SimpleGrid columns={[2, 3]} spacing={5}>
            {books.map((book) => (
              // ★ここが重要！ クリックすると /edit/本のID に飛びます
              <Link key={book.id} to={`/edit/${book.id}`}>
                <Card overflow="hidden" variant="outline" cursor="pointer" _hover={{ boxShadow: "lg" }}>
                  <Image src={book.cover_url} alt={book.title} objectFit="cover" height="200px" width="100%" />
                  <CardBody p={3}>
                    <Text fontWeight="bold" noOfLines={2}>{book.title}</Text>
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
}