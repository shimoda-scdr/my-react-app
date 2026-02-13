import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useParams } from 'react-router-dom';
import { 
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Image, Text, Textarea, HStack, Card, CardBody, Divider 
} from '@chakra-ui/react';

export default function BookDetail() {
    const { id } = useParams();
    const toast = useToast();

    const [book, setBook] = useState(null);
    const [reviews,setReviews] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const [score, setScore] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAllData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 2. 本の情報を取得 (booksテーブル)
        const { data: bookData } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();
        if (bookData) setBook(bookData);

        // 3. レビュー情報を取得 (reviewsテーブル)
        const { data: reviewData } = await supabase
            .from('reviews')
            .select('*, profiles(username)')
            .eq('book_id', id)
            .order('created_at', { ascending: false });
        if (reviewData) setReviews(reviewData);
    };

    useEffect(() => {
        fetchAllData();
    }, [id]);
    // ==========================================
  // ③ レビューを保存する処理
  // ==========================================
    const handleSubmitReview = async (e) => {
        e.preventDefault();

    if (!score || !reviewText) {
        toast({ title: 'エラー', description: '点数と感想を入力してください', status: 'error' });
        return;
    }

    setLoading(true);

    // reviewsテーブルに書き込むデータ
    const newReview = {
      book_id: Number(id),              // どの本に対するレビューか
      user_id: currentUser.id,  // 誰が書いたか（今の自分）
      score: parseInt(score),   // 点数（文字を数字に変換）
      review: reviewText        // 感想
    };

    const { error } = await supabase.from('reviews').insert([newReview]);

    if (error) {
        toast({ title: 'エラー', description: 'レビューの保存に失敗しました', status: 'error' });
    } else {
        toast({ title: '成功', description: 'レビューを保存しました', status: 'success' , duration: 3000});
        setScore('');
        setReviewText('');
        fetchAllData();
    }
    setLoading(false);
  };

  // まだ本のデータが読み込めていない時の表示
  if (!book) return <Container py={10}><Text>読み込み中...</Text></Container>;

  //　画面の表示

  return (
    <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">

            {/* 本の詳細情報 */}
            <Box textAlign="center">
                <Heading as="h1" size="xl" mb={4}>{book.title}</Heading>
                <Image src={book} alt={book.title} maxH="300px" mx="auto" borderRadius="md" boxShadow="md" />
            </Box>
            <Divider />

            {/* レビュー投稿フォーム */}
            <Box as="form" onSubmit={handleSubmitReview} p={6} borderWidth={1} borderRadius="lg" bg="white">
                <Heading size="md" mb={4}>レビューを書く</Heading>
                <VStack spacing={4}>
                <FormControl isRequired>
                    <FormLabel>点数 (100点満点)</FormLabel>
                    <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} max={100} min={0} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>感想</FormLabel>
                    <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} />
                </FormControl>
                <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>投稿する</Button>
            </VStack>
        </Box>

        {/* ▼ みんなのレビュー一覧エリア */}
        <Box>
          <Heading size="md" mb={4}>みんなのレビュー ({reviews.length}件)</Heading>
          <VStack spacing={4} align="stretch">
            {reviews.length === 0 ? (
              <Text color="gray.500">まだレビューがありません。最初のレビューを書きましょう！</Text>
            ) : (
              reviews.map((rev) => (
                <Card key={rev.id} variant="outline">
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      {/* profilesテーブルから引っ張ってきた名前を表示 */}
                      <Text fontWeight="bold">{rev.profiles?.username} さん</Text>
                      <Text fontWeight="bold" color="blue.500">Score: {rev.score}点</Text>
                    </HStack>
                    <Text>{rev.review}</Text>
                  </CardBody>
                </Card>
              ))
            )}
          </VStack>
        </Box>

      </VStack>
    </Container>
  );
}