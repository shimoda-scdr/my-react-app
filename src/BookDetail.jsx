// src/BookDetail.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, FormControl, FormLabel, Input, Heading, VStack, useToast, Image, Text, Textarea, HStack, Card, CardBody, Divider,
  Tag, Wrap, WrapItem // ★この3つを追加
} from '@chakra-ui/react';

export default function BookDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // ★追加: ログインユーザーの権限（role）を保存する箱
  const [currentUserRole, setCurrentUserRole] = useState('user'); 

  const [score, setScore] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);

  const fetchAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // ★追加: profilesテーブルから、自分の権限（adminかuserか）を取得する
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) setCurrentUserRole(profile.role);
    }

    const { data: bookData } = await supabase.from('books').select('*').eq('id', id).single();
    if (bookData) setBook(bookData);

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('book_id', id)
      .order('created_at', { ascending: false });
      
    if (reviewData) {
      setReviews(reviewData);
      
      if (user) {
        const existingReview = reviewData.find(rev => rev.user_id === user.id);
        if (existingReview) {
          setMyReview(existingReview);
          setScore(existingReview.score);
          setReviewText(existingReview.review);
        } else {
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!score || !reviewText) {
      toast({ title: 'エラー', description: '点数と感想を入力してください', status: 'error' });
      return;
    }
    setLoading(true);

    if (myReview) {
      const { error } = await supabase.from('reviews').update({ score: Number(score), review: reviewText }).eq('id', myReview.id);
      if (error) toast({ title: 'エラー', description: '更新に失敗しました', status: 'error' });
      else {
        toast({ title: '成功', description: 'レビューを更新しました', status: 'success', duration: 3000 });
        fetchAllData();
      }
    } else {
      const newReview = { book_id: Number(id), score: Number(score), review: reviewText };
      const { error } = await supabase.from('reviews').insert([newReview]);
      if (error) toast({ title: 'エラー', description: '保存に失敗しました', status: 'error' });
      else {
        toast({ title: '成功', description: 'レビューを保存しました', status: 'success', duration: 3000 });
        fetchAllData();
      }
    }
    setLoading(false);
  };

  // ==========================================
  // ★追加：レビューの削除処理
  // ==========================================
  const handleDeleteReview = async (reviewId) => {
    // 間違えてクリックした時のために確認ダイアログを出す
    if (!window.confirm('本当にこのレビューを削除しますか？')) return;

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    
    if (error) {
      toast({ title: 'エラー', description: '削除に失敗しました', status: 'error' });
    } else {
      toast({ title: '成功', description: 'レビューを削除しました', status: 'success', duration: 3000 });
      fetchAllData(); // 削除後、画面を最新の状態にする
    }
  };

  if (!book) return <Container py={10}><Text>読み込み中...</Text></Container>;

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">

        <Box>
            <Button as={Link} to="/" variant="ghost" colorScheme="blue" size="sm">
                ← ホームに戻る
            </Button>
        </Box>

        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>{book.title}</Heading>

{/* ▼▼▼ この部分を書き換えます ▼▼▼ */}
          {book.tags && book.tags.length > 0 && (
            <Wrap justify="center" mb={4} spacing={2}>
              {book.tags.map((tag, index) => (
                <WrapItem key={index}>
                  <Tag 
                    size="md" 
                    colorScheme="teal" 
                    borderRadius="full"
                    cursor="pointer" // ★追加：クリックできる指のマークにする
                    _hover={{ opacity: 0.7 }} // ★追加：ホバー時に少し透明にする
                    onClick={() => navigate('/', { state: { searchTag: tag } })} // ★追加：ホーム画面に tag を持たせて移動する
                  >
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
          {/* ▲▲▲ ここまで ▲▲▲ */}
          <Image src={book.cover_url} alt={book.title} maxH="300px" loading='lazy' mx="auto" borderRadius="md" boxShadow="md" />
        </Box>
        <Divider />

        <Box as="form" onSubmit={handleSubmitReview} p={6} borderWidth={1} borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>{myReview ? '自分のレビューを編集する' : 'レビューを書く'}</Heading>
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
              {myReview ? '更新する' : '投稿する'}
            </Button>
          </VStack>
        </Box>

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
                      <HStack>
                        <Link to={`/profile/${rev.user_id}`} state={{ username: rev.profiles?.username }}> {/* ★プロフィールページへのリンク */}
                          <Text fontWeight="bold" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                            {rev.profiles?.username} さん
                          </Text>
                        </Link>
                        {rev.user_id === currentUser?.id && <Text as="span" color="blue.500" fontSize="sm">(あなた)</Text>}
                      </HStack>
                      
                      <HStack spacing={4}>
                        <Text fontWeight="bold" color="blue.500">Score: {rev.score}点</Text>
                        
                        {/* ★追加: 管理者(admin) または 自分のレビュー の場合に「削除」ボタンを表示 */}
                        {(currentUserRole === 'admin' || rev.user_id === currentUser?.id) && (
                          <Button size="xs" colorScheme="red" variant="outline" onClick={() => handleDeleteReview(rev.id)}>
                            削除
                          </Button>
                        )}
                      </HStack>

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