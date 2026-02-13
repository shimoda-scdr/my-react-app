// src/BookDetail.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useParams, Link } from 'react-router-dom';
import { 
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Image, Text, Textarea, HStack, Card, CardBody, Divider 
} from '@chakra-ui/react';

export default function BookDetail() {
  const { id } = useParams();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [score, setScore] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ★追加: 自分の既存のレビューデータを記憶しておく箱
  const [myReview, setMyReview] = useState(null);

  const fetchAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // 本の情報を取得 (booksテーブル)
    const { data: bookData } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();
    if (bookData) setBook(bookData);

    // レビュー情報を取得 (reviewsテーブル)
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('book_id', id)
      .order('created_at', { ascending: false });
      
    if (reviewData) {
      setReviews(reviewData);
      
      // ★追加: 取得したレビューの中に、自分が書いたものがあるか探す
      if (user) {
        const existingReview = reviewData.find(rev => rev.user_id === user.id);
        if (existingReview) {
          // あれば、その情報をStateに入れて、フォームに最初から文字を入れておく
          setMyReview(existingReview);
          setScore(existingReview.score);
          setReviewText(existingReview.review);
        } else {
          // なければ空っぽにする
          setMyReview(null);
          setScore('');
          setReviewText('');
        }
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // ==========================================
  // レビューを保存、または「更新」する処理
  // ==========================================
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!score || !reviewText) {
      toast({ title: 'エラー', description: '点数と感想を入力してください', status: 'error' });
      return;
    }

    setLoading(true);

    if (myReview) {
      // ▼ すでに自分のレビューがある場合：新しく作らず「上書き（update）」する
      const { error } = await supabase
        .from('reviews')
        .update({
          score: Number(score),
          review: reviewText
        })
        .eq('id', myReview.id); // 自分のレビューIDを指定して更新

      if (error) {
        toast({ title: 'エラー', description: 'レビューの更新に失敗しました', status: 'error' });
      } else {
        toast({ title: '成功', description: 'レビューを更新しました', status: 'success', duration: 3000 });
        fetchAllData(); // 最新のデータを読み込み直す
      }
    } else {
      // ▼ まだレビューがない場合：今まで通り「新規作成（insert）」する
      const newReview = {
        book_id: Number(id),
        score: Number(score),
        review: reviewText
      };

      const { error } = await supabase.from('reviews').insert([newReview]);

      if (error) {
        toast({ title: 'エラー', description: 'レビューの保存に失敗しました', status: 'error' });
      } else {
        toast({ title: '成功', description: 'レビューを保存しました', status: 'success', duration: 3000 });
        fetchAllData(); // 最新のデータを読み込み直す
      }
    }
    setLoading(false);
  };

  if (!book) return <Container py={10}><Text>読み込み中...</Text></Container>;

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">

        {/* 戻るボタン */}
        <Box>
            <Button as={Link} to="/" variant="ghost" colorScheme="blue" size="sm">
                ← ホームに戻る
            </Button>
        </Box>

        {/* 本の詳細情報 */}
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>{book.title}</Heading>
          <Image src={book.cover_url} alt={book.title} maxH="300px" mx="auto" borderRadius="md" boxShadow="md" />
        </Box>
        <Divider />

        {/* ▼ レビュー投稿・編集フォーム */}
        <Box as="form" onSubmit={handleSubmitReview} p={6} borderWidth={1} borderRadius="lg" bg="white">
          {/* ★ すでに書いていればタイトルを「編集する」に変える */}
          <Heading size="md" mb={4}>
            {myReview ? '自分のレビューを編集する' : 'レビューを書く'}
          </Heading>
          
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>点数 (100点満点)</FormLabel>
              <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} max={100} min={0} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>感想</FormLabel>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} />
            </FormControl>
            <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>
              {/* ★ ボタンの文字も変更する */}
              {myReview ? '更新する' : '投稿する'}
            </Button>
          </VStack>
        </Box>

        {/* みんなのレビュー一覧エリア */}
        <Box>
          <Heading size="md" mb={4}>みんなのレビュー ({reviews.length}件)</Heading>
          <VStack spacing={4} align="stretch">
            {reviews.length === 0 ? (
              <Text color="gray.500">まだレビューがありません。最初のレビューを書きましょう！</Text>
            ) : (
              reviews.map((rev) => (
                <Card key={rev.id} variant="outline" bg={rev.user_id === currentUser?.id ? "blue.50" : "white"}>
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">
                        {rev.profiles?.username} さん 
                        {/* 自分のレビューなら「（あなた）」と表示 */}
                        {rev.user_id === currentUser?.id && <Text as="span" color="blue.500" ml={2}>(あなた)</Text>}
                      </Text>
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